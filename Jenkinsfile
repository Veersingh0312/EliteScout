pipeline {
    agent any

    options {
        timeout(time: 30, unit: 'MINUTES')
        retry(2)
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '5'))
    }

    environment {
        AZ_WEBAPP_NAME = 'football-mlops-app'
        DOCKER_IMAGE = 'veersinghx7/football-mlops'
        MLFLOW_TRACKING_URI = 'http://localhost:5050'
        PYTHON_PATH = "C:\\Users\\veers\\AppData\\Local\\Programs\\Python\\Python311\\python.exe"
        PYTHONUTF8 = '1'
        PYTHONIOENCODING = 'utf-8'
    }

    stages {
        stage('Environment Audit') {
            steps {
                script {
                    if (isUnix()) {
                        sh "free -m || true"
                        sh "df -h"
                    } else {
                        bat "powershell -Command \"Get-WmiObject Win32_OperatingSystem | Select-Object TotalVisibleMemorySize, FreePhysicalMemory\""
                    }
                }
            }
        }

        stage('Initialize & Dependencies') {
            steps {
                script {
                    echo "Checking Virtual Environment Cache..."
                    if (isUnix()) {
                        sh "test -d venv || python3 -m venv venv"
                        sh ". venv/bin/activate && pip install --upgrade pip"
                        sh ". venv/bin/activate && pip install --prefer-binary -r backend/requirements.txt"
                        sh ". venv/bin/activate && pip install dvc"
                    } else {
                        bat """
                        if not exist venv (
                            "${PYTHON_PATH}" -m venv venv
                        )
                        venv\\Scripts\\python.exe -m pip install --upgrade pip
                        venv\\Scripts\\pip install --prefer-binary -r backend\\requirements.txt
                        venv\\Scripts\\pip install dvc
                        """
                    }
                }
            }
        }

        stage('Data & Model Refresh') {
            steps {
                script {
                    if (isUnix()) {
                        sh ". venv/bin/activate && dvc pull --no-run-cache || echo 'DVC pull failed, continuing with local data...'"
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
                    } else {
                        bat """
                        venv\\Scripts\\python.exe -m backend.app.ml.train_regression
                        venv\\Scripts\\python.exe -m backend.app.ml.train_classifier
                        """
                    }
                    echo "Metrics logged to MLflow via ${MLFLOW_TRACKING_URI}"
                }
            }
        }

        stage('Container Build') {
            steps {
                script {
                    echo "Building Production Docker Image (Memory Optimized)..."
                    if (isUnix()) {
                        sh "docker build --no-cache -t ${DOCKER_IMAGE}:latest --memory=3g ."
                        sh "docker tag ${DOCKER_IMAGE}:latest ${DOCKER_IMAGE}:${BUILD_NUMBER}"
                    } else {
                        bat """
                        docker build -t ${DOCKER_IMAGE}:latest .
                        docker tag ${DOCKER_IMAGE}:latest ${DOCKER_IMAGE}:%BUILD_NUMBER%
                        """
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
                            bat "docker push ${DOCKER_IMAGE}:%BUILD_NUMBER%"
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                echo "Cleaning up build artifacts..."
                if (isUnix()) {
                    sh "docker system prune -f || true"
                } else {
                    bat "docker system prune -f"
                }
            }
            cleanWs()
        }
        success {
            echo "Pipeline SUCCESS - Build #${BUILD_NUMBER} deployed."
        }
        failure {
            echo "Pipeline FAILURE - MLOps checks failed. Resources may be exhausted."
        }
    }
}