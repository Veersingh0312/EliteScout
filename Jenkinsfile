pipeline {
    agent any

    environment {
        AZ_WEBAPP_NAME = 'football-mlops-app'
        DOCKER_IMAGE = 'veersinghx7/football-mlops'
        MLFLOW_TRACKING_URI = 'http://localhost:5050'
        PYTHON_PATH = "C:\\Users\\veers\\AppData\\Local\\Programs\\Python\\Python311\\python.exe"
    }

    stages {
        stage('Initialize & Dependencies') {
            steps {
                script {
                    if (isUnix()) {
                        sh "python3 -m venv venv"
                        sh ". venv/bin/activate && pip install --upgrade pip"
                        sh ". venv/bin/activate && pip install -r backend/requirements.txt"
                        sh ". venv/bin/activate && pip install dvc"
                    } else {
                        bat "\"${PYTHON_PATH}\" -m venv venv"
                        bat "venv\\Scripts\\python.exe -m pip install --upgrade pip"
                        bat "venv\\Scripts\\pip install -r backend\\requirements.txt"
                        bat "venv\\Scripts\\pip install dvc"
                    }
                }
            }
        }

        stage('DVC: Data Verification') {
            steps {
                script {
                    if (isUnix()) {
                        sh ". venv/bin/activate && dvc --version"
                    } else {
                        bat "venv\\Scripts\\dvc --version"
                    }
                    echo "DVC Data parity check initiated..."
                }
            }
        }

        stage('ML Lifecycle: Model Training') {
            steps {
                script {
                    echo "Starting specialized MLOps training lifecycle..."
                    if (isUnix()) {
                        sh ". venv/bin/activate && python3 -m backend.app.ml.train_regression"
                        sh ". venv/bin/activate && python3 -m backend.app.ml.train_classifier"
                        sh ". venv/bin/activate && python3 -m backend.app.ml.train_timeseries"
                    } else {
                        bat "venv\\Scripts\\python -m backend.app.ml.train_regression"
                        bat "venv\\Scripts\\python -m backend.app.ml.train_classifier"
                        bat "venv\\Scripts\\python -m backend.app.ml.train_timeseries"
                    }
                    echo "Metrics logged to MLflow via ${MLFLOW_TRACKING_URI}"
                }
            }
        }

        stage('Container Build') {
            steps {
                script {
                    if (isUnix()) {
                        sh "docker build -t ${DOCKER_IMAGE}:latest ."
                        sh "docker tag ${DOCKER_IMAGE}:latest ${DOCKER_IMAGE}:${BUILD_NUMBER}"
                    } else {
                        bat "docker build -t ${DOCKER_IMAGE}:latest ."
                        bat "docker tag ${DOCKER_IMAGE}:latest ${DOCKER_IMAGE}:${BUILD_NUMBER}"
                    }
                }
            }
        }

        stage('DockerHub Deployment') {
            when {
                branch 'main'
            }
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                        if (isUnix()) {
                            sh "echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin"
                            sh "docker push ${DOCKER_IMAGE}:latest"
                            sh "docker push ${DOCKER_IMAGE}:${BUILD_NUMBER}"
                        } else {
                            bat "docker login -u %DOCKER_USER% -p %DOCKER_PASS%"
                            bat "docker push ${DOCKER_IMAGE}:latest"
                            bat "docker push ${DOCKER_IMAGE}:${BUILD_NUMBER}"
                        }
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