FROM jenkins/jenkins:lts
USER root

RUN apt-get update -y && apt-get install -y --no-install-recommends \
    curl wget git unzip zip ca-certificates gnupg lsb-release build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get install -y --no-install-recommends \
    xvfb \
    xauth \
    libgtk2.0-0 \
    libgtk-3-0 \
    libgbm-dev \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libx11-xcb1 \
    libnotify-dev \
    libnss3 \
    libxss1 \
    libasound2 \
    libxtst6 \
    && rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get install -y docker.io \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /usr/local/lib/docker/cli-plugins && \
    ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then ARCH="x86_64"; \
    elif [ "$ARCH" = "aarch64" ]; then ARCH="aarch64"; \
    else ARCH="x86_64"; fi && \
    curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-${ARCH} \
    -o /usr/local/lib/docker/cli-plugins/docker-compose && \
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

COPY --from=docker/buildx-bin:latest /buildx /usr/local/lib/docker/cli-plugins/docker-buildx

RUN chmod +x /usr/local/lib/docker/cli-plugins/docker-buildx

RUN apt-get update -y && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

RUN groupadd -f docker && usermod -aG docker jenkins

USER jenkins