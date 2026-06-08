pipeline {
    agent {
        docker {
            image 'stephano21/jenkins-ci:latest'
            args '-u root'
        }
    }

    parameters {
        booleanParam(name: 'RUN_SONAR', defaultValue: true, description: 'Ejecutar analisis SonarQube')
        booleanParam(name: 'RUN_UNIT_TESTS_FRONTEND', defaultValue: true, description: 'Frontend tests')
        booleanParam(name: 'RUN_UNIT_TESTS_BACKEND', defaultValue: true, description: 'Backend tests')
        booleanParam(name: 'RUN_CYPRESS_TESTS', defaultValue: true, description: 'Cypress tests')
    }

    tools {
        nodejs 'NodeJS-22'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm

                sh 'git branch'
                sh 'git log --oneline -n 3'
            }
        }

        stage('Frontend Tests') {
            when { expression { params.RUN_UNIT_TESTS_FRONTEND } }
            steps {
                dir('frontend') {
                    catchError(buildResult: 'UNSTABLE', stageResult: 'SUCCESS') {
                        sh 'npm install'
                        sh 'npm test -- --coverage --coverageReporters=lcov --coverageDirectory=coverage'
                    }
                }
            }
        }

        stage('Backend Tests') {
            when { expression { params.RUN_UNIT_TESTS_BACKEND } }
            steps {
                dir('backend') {
                    catchError(buildResult: 'UNSTABLE', stageResult: 'SUCCESS') {
                        withCredentials([
                            string(credentialsId: 'DB_HOST', variable: 'DB_HOST'),
                            string(credentialsId: 'DB_PORT', variable: 'DB_PORT'),
                            string(credentialsId: 'DB_NAME', variable: 'DB_NAME'),
                            string(credentialsId: 'DB_USER', variable: 'DB_USER'),
                            string(credentialsId: 'DB_PASSWORD', variable: 'DB_PASSWORD'),
                            string(credentialsId: 'DATABASE_URL', variable: 'DATABASE_URL')
                        ]) {
                            sh '''
                                python3 -m venv venv
                                . venv/bin/activate
                                pip install --upgrade pip
                                pip install -r requirements.txt
                                pytest --cov=src --cov-report=xml:coverage.xml
                            '''
                        }
                    }
                }
            }
        }

        stage('SonarQube') {
            when { expression { params.RUN_SONAR } }

            steps {
                script {
                    dir('backend') {
                        withSonarQubeEnv('SonarQube') {
                            sh 'npx sonar-scanner'
                        }
                    }

                    dir('frontend') {
                        withSonarQubeEnv('SonarQube') {
                            sh 'npx sonar-scanner'
                        }
                    }
                }
            }
        }

        stage('Debug Backend') {
            steps {
                sh '''
                cat backend/Dockerfile
                ls -la backend
                '''
            }
        }

        stage('Start E2E Environment') {
            when { expression { params.RUN_CYPRESS_TESTS } }

            steps {
                withCredentials([
                    string(credentialsId: 'DATABASE_URL', variable: 'DATABASE_URL')
                ]) {
                    sh 'docker compose -f docker-compose.e2e.yml down || true'

                    sh 'docker compose -f docker-compose.e2e.yml up -d --build'

                    sh '''
                    docker compose -f docker-compose.e2e.yml ps
                    docker compose -f docker-compose.e2e.yml logs backend
                    docker compose -f docker-compose.e2e.yml logs frontend
                    '''

                    sh 'curl --retry 30 --retry-delay 2 --retry-connrefused http://heuristic-evaluations-pipeline-frontend-1:3000'
                    sh 'curl --retry 30 --retry-delay 2 --retry-connrefused http://heuristic-evaluations-pipeline-backend-1:8000'
                }
            }
        }

        stage('Cypress Tests') {
            when { expression { params.RUN_CYPRESS_TESTS } }
            steps {
                dir('frontend') {
                    catchError(buildResult: 'UNSTABLE', stageResult: 'SUCCESS') {
                        sh 'npm ci'
                        sh 'npx cypress install'
                        sh 'npx cypress verify'
                        sh 'npm run cypress:run'
                        sh 'npm run cypress:run'
                    }
                }
            }
            post {
                always {
                    sh 'docker compose -f docker-compose.e2e.yml down || true'
                }
            }
        }

    }
}