pipeline {
    agent any

    tools {
        nodejs 'NodeJS-22'
    }

    stages {

        // stage('Checkout') {
        //     steps {
        //         git branch: 'main',
        //             url: 'https://github.com/usuario/repositorio.git'
        //     }
        // }

        // stage('Backend Tests') {
        //     steps {
        //         dir('backend') {
        //             sh 'pytest'
        //         }
        //     }
        // }

        stage('Frontend Tests') {
            steps {
                sh 'npm ci'
                sh 'npm test'
            }
        }
    }
}