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
        booleanParam(name: 'RUN_SECURITY_TESTS', defaultValue: true, description: 'Ejecutar analisis de seguridad en backend y frontend')
        booleanParam(name: 'RUN_API_TESTS', defaultValue: true, description: 'Ejecutar analisis de API backend')
        booleanParam(name: 'RUN_PERFORMANCE_TESTS', defaultValue: true, description: 'Ejecutar analisis de rendimiento en backend (locust) y frontend (lighthouse)')
        booleanParam(name: 'RUN_REGRESSION_TESTS', defaultValue: true, description: 'Ejecutar analisis de regresion en backend y frontend')

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
                        sh 'npm test --tests/unit --coverage --coverageReporters=lcov --coverageDirectory=coverage'
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
                                pytest tests/unit_test --cov=src --cov-report=xml:coverage.xml
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

        
        stage('Backend Security Tests') {
            when { expression { params.RUN_SECURITY_TESTS } }
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
                                . venv/bin/activate
                                pytest tests/security
                            '''
                        }
                    }
                }
                dir('frontend') {
                    catchError(buildResult: 'UNSTABLE', stageResult: 'SUCCESS') {
                        sh 'npm test --tests/security'
                    }
                }
            }
        }
        
        stage('Backend API Tests') {
            when { expression { params.RUN_API_TESTS } }
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
                                . venv/bin/activate
                                pytest tests/api
                            '''
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
                    sh 'docker compose -f docker-compose.e2e.yml up -d --build'

                    sh '''
                    docker compose -f docker-compose.e2e.yml ps
                    docker compose -f docker-compose.e2e.yml logs backend
                    docker compose -f docker-compose.e2e.yml logs frontend
                    '''

                    sh '''
                    FRONTEND_IP=$(docker inspect -f "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" heuristic-evaluations-pipeline-frontend-1)
                    BACKEND_IP=$(docker inspect -f "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" heuristic-evaluations-pipeline-backend-1)
                    echo "Frontend IP: $FRONTEND_IP"
                    echo "Backend IP: $BACKEND_IP"
                    curl --retry 30 --retry-delay 2 --retry-connrefused http://$FRONTEND_IP:3000
                    curl --retry 30 --retry-delay 2 --retry-connrefused http://$BACKEND_IP:8000
                    '''
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
                        sh '''
                            FRONTEND_IP=$(docker inspect -f "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" heuristic-evaluations-pipeline-frontend-1)
                            BACKEND_IP=$(docker inspect -f "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" heuristic-evaluations-pipeline-backend-1)
                            CYPRESS_BASE_URL=http://$FRONTEND_IP:3000 CYPRESS_API_URL=http://$BACKEND_IP:8000 npm run cypress:run
                        '''
                    }
                }
            }
            post {
                always {
                    withCredentials([string(credentialsId: 'DATABASE_URL', variable: 'DATABASE_URL')]) {
                        sh 'docker compose -f docker-compose.e2e.yml down || true'
                    }
                }
            }
        }

    }
}