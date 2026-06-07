FROM jenkins/jenkins:lts
USER root

RUN apt-get update -y && apt-get install -y --no-install-recommends \
    curl wget git unzip zip ca-certificates gnupg lsb-release build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get install -y docker.io \
    && rm -rf /var/lib/apt/lists/*

RUN apt-get update -y && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

RUN groupadd -f docker && usermod -aG docker jenkins

USER jenkins