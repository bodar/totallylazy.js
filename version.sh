#!/usr/bin/env bash
set -e

export BRANCH=${BRANCH_NAME-$(git rev-parse --abbrev-ref HEAD)}
export BUILD_NUMBER=${SEMAPHORE_BUILD_NUMBER-$(date +"%Y%m%d%H%M%S" -u)+${USER}}

if [ "${CI}" = "true" ] && [ "${BRANCH}" = "master" ]; then
    export TAG="latest"
else
    export TAG="dev"
fi

export REVISIONS=$(git rev-list --count ${BRANCH})
export VERSION=0.${REVISIONS}.${BUILD_NUMBER}