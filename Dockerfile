# Anchor Development Container
# This builds Anchor from scratch - suitable for all environments

# Stage 0: Build yamlfmt
FROM golang:1 AS go-builder
# defined from build kit
# DOCKER_BUILDKIT=1 docker build . -t ...
ARG TARGETARCH

# Install yamlfmt
WORKDIR /yamlfmt
RUN go install github.com/google/yamlfmt/cmd/yamlfmt@latest && \
    strip $(which yamlfmt) && \
    yamlfmt --version

# Stage 1: Node setup
FROM debian:stable-slim AS node-slim
RUN export DEBIAN_FRONTEND=noninteractive && \
    apt-get update && \
    apt-get install -y -q --no-install-recommends \
    build-essential git gnupg2 curl \
    ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

ENV NODE_VERSION=v20.9.0
ENV NVM_DIR=/usr/local/nvm

RUN mkdir -p ${NVM_DIR}
ADD https://raw.githubusercontent.com/creationix/nvm/master/install.sh /usr/local/etc/nvm/install.sh
RUN bash /usr/local/etc/nvm/install.sh

# Stage 2: Solana Dev
FROM ghcr.io/jac18281828/solana:latest

RUN export DEBIAN_FRONTEND=noninteractive && \
    sudo apt-get update && \
    sudo apt-get install -y -q --no-install-recommends \
    unzip \
    build-essential && \
    sudo apt-get clean && \
    sudo rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*


ENV USER=solana
ARG SOLANA=1.18.26
ENV CARGO_HOME=/usr/local/cargo
ENV RUSTUP_HOME=/usr/local/rustup
ENV PATH=${PATH}:/usr/local/cargo/bin:/go/bin:/home/solana/.local/share/solana/install/releases/${SOLANA}/bin
USER solana

# Set user and working directory
ARG PACKAGE=anchor
WORKDIR /workspaces/${PACKAGE}

RUN rustup toolchain install 1.78.0  && \
    rustup component add rustfmt clippy rust-analyzer --toolchain 1.78.0 && \
    rustup default 1.78.0

# Install Node
ENV NODE_VERSION=v20.9.0
ENV NVM_DIR=/usr/local/nvm
ENV NVM_NODE_PATH=${NVM_DIR}/versions/node/${NODE_VERSION}
ENV NODE_PATH=${NVM_NODE_PATH}/lib/node_modules
ENV PATH=${NVM_NODE_PATH}/bin:$PATH
COPY --from=node-slim --chown=${USER}:${USER} /usr/local/nvm /usr/local/nvm
RUN bash -c ". $NVM_DIR/nvm.sh && nvm install $NODE_VERSION && nvm alias default $NODE_VERSION && nvm use default"

RUN npm install npm -g
RUN npm install yarn -g

USER solana
# Install Bun
ADD --chown=${USER}:${USER} --chmod=555 https://bun.sh/install /bun/install.sh


# Install Anchor
RUN cargo install --git https://github.com/coral-xyz/anchor avm --locked --force && \
    avm install 0.29.0 && \
    avm use 0.29.0 && \
    anchor --version

# For building
RUN sudo apt-get update && \
    sudo apt-get install -y \
    clang \
    libudev-dev \
    libssl-dev \
    pkg-config \
    build-essential

# Additional Solana development tools
RUN cargo install spl-token-cli --locked && \
    cargo install solana-program-library --locked && \
    cargo install --git https://github.com/project-serum/anchor avm --locked && \
    avm install latest && \
    avm use latest

# Install additional tools for frontend development
RUN npm install -g \
    typescript \
    ts-node \
    @solana/web3.js \
    @project-serum/anchor \
    @solana/spl-token

# Final preparations
RUN echo "export PATH=$PATH:/home/solana/.local/share/solana/install/active_release/bin" >> /home/solana/.bashrc && \
    echo "export PATH=$PATH:/home/solana/.cargo/bin" >> /home/solana/.bashrc

# Verify installations
RUN solana --version && \
    anchor --version && \
    cargo --version && \
    node --version && \
    npm --version && \
    yarn --version

CMD [ "anchor", "--version" ] 