pipeline {
    agent any

    parameters {
        booleanParam(name: 'RUN_SONAR',        defaultValue: true, description: 'Ejecutar analisis SonarQube')
        booleanParam(name: 'RUN_UNIT_TESTS_FRONTEND',   defaultValue: true, description: 'Ejecutar unit tests de Frontend')
        booleanParam(name: 'RUN_UNIT_TESTS_BACKEND',        defaultValue: true, description: 'Ejecutar unit tests de Backend')
    }

    tools {
        nodejs 'NodeJS-22'
    }

    stages {

        stage('SonarQube') {
            when{
                expression {params.RUN_SONAR}
            }
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

        stage('Frontend Tests') {
            when{
                expression {params.RUN_UNIT_TESTS_FRONTEND}
            }
            steps {
                dir('frontend') {
                    catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
                        sh 'npm install'
                        sh 'npm test'
                    }
                }
            }
        }

        stage('Backend Tests') {
            when{
                expression {params.RUN_UNIT_TESTS_BACKEND}
            }
            steps {
                dir('backend') {
                    catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
                        sh 'pip3 install -r requirements.txt'
                        sh 'pytest'
                    }
                }
            }
        }
    }
}