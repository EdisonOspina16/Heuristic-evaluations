pipeline {
    agent any

    tools {
        nodejs 'NodeJS-22'
    }

    stages {

        stage('Frontend Install') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                }
            }
        }

        stage('Frontend Tests') {
            steps {
                dir('frontend') {
                    catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
                        sh 'npm test'
                    }
                }
            }
        }

        stage('Backend Install') {
            steps {
                dir('backend') {
                    catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
                        sh 'pip3 install -r requirements.txt'
                    }
                }
            }
        }

        stage('Backend Tests') {
            steps {
                dir('backend') {
                    catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
                        sh 'pytest'
                    }
                }
            }
        }
    }
}