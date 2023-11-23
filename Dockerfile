FROM ubuntu:focal AS base
WORKDIR /usr/local/bin
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y software-properties-common nano curl git build-essential ansible && \
    apt-get clean autoclean && \
    apt-get autoremove --yes

FROM base AS prime
# RUN addgroup --gid 1000 spidey
# RUN adduser --gecos spidey --uid 1000 --gid 1000 --disabled-password spidey
# USER spidey
# WORKDIR /home/spidey

FROM prime
WORKDIR /root
COPY ./tasks ./installer/tasks
COPY ./local.yml ./installer/local.yml
RUN ansible-playbook ./installer/local.yml
# CMD ["sh","-c","ansible-playbook", "./installer/local.yml"]
