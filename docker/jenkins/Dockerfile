FROM jenkins/jenkins:lts
USER root

# Install Docker CLI
RUN apt-get update && \
    apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && \
    apt-get install -y docker-ce-cli

# Install Python 3.10 and build dependencies
RUN apt-get install -y python3 python3-pip python3-venv

# Ensure jenkins user has permission to use docker socket
# (We handle this via volume mount of docker.sock, but some setups need root or group adds)
# RUN usermod -aG docker jenkins

USER jenkins
