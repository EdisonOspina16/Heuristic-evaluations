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
    }

    tools {
        nodejs 'NodeJS-22'
    }

    stages {

        stage('Frontend Tests') {
            when { expression { params.RUN_UNIT_TESTS_FRONTEND } }
            steps {
                dir('frontend') {
                    catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
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
                    catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
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

    }
}