FROM rust:1.80-slim-bookworm AS builder
WORKDIR /usr/src/meshclaw
COPY . .
RUN cargo build --release --bin meshclaw-core

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /usr/src/meshclaw/target/release/meshclaw-core /usr/local/bin/
CMD ["meshclaw-core"]
