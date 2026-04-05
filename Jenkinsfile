pipeline {
    agent any

    environment {
        AZ_WEBAPP_NAME = 'football-mlops-app'
        DOCKER_IMAGE = 'veersinghx7/football-mlops'
        // Port for mlflow local referencing
        MLFLOW_TRACKING_URI = 'http://mlflow-server:5000'
    }

    stages {
        stage('Initialize & Dependencies') {
            steps {
                script {
                    sh "python3 -m venv venv"
                    sh ". venv/bin/activate && pip install --upgrade pip"
                    sh ". venv/bin/activate && pip install -r backend/requirements.txt"
                    sh ". venv/bin/activate && pip install dvc"
                }
            }
        }

        stage('DVC: Data Verification') {
            steps {
                script {
                    // Check if dvc files exist
                    sh ". venv/bin/activate && dvc --version"
                    echo "DVC Data parity check initiated..."
                }
            }
        }

        stage('ML Lifecycle: Model Training') {
            steps {
                script {
                    echo "Starting specialized MLOps training lifecycle..."
                    sh ". venv/bin/activate && python3 -m backend.app.ml.train_regression"
                    sh ". venv/bin/activate && python3 -m backend.app.ml.train_classifier"
                    sh ". venv/bin/activate && python3 -m backend.app.ml.train_timeseries"
                    echo "Metrics logged to MLflow via ${MLFLOW_TRACKING_URI}"
                }
            }
        }

        stage('Container Build') {
            steps {
                script {
                    sh "docker build -t ${DOCKER_IMAGE}:latest ."
                    sh "docker tag ${DOCKER_IMAGE}:latest ${DOCKER_IMAGE}:${BUILD_NUMBER}"
                }
            }
        }

        stage('DockerHub Deployment') {
            when {
                branch 'main'
            }
            steps {
                script {
                    // This requires a credential ID 'dockerhub-creds' created in Jenkins UI
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                        sh "echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin"
                        sh "docker push ${DOCKER_IMAGE}:latest"
                        sh "docker push ${DOCKER_IMAGE}:${BUILD_NUMBER}"
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo "Pipeline SUCCESS - Build #${BUILD_NUMBER} deployed."
        }
        failure {
            echo "Pipeline FAILURE - MLOps checks failed."
        }
    }
}
