#!/usr/bin/env bash
set -e

export BRANCH=${CIRCLE_BRANCH-$(git rev-parse --abbrev-ref HEAD)}
export BUILD_NUMBER=${CIRCLE_BUILD_NUM-$(date -u +"%Y%m%d%H%M%S")}

if [ "${CI}" = "true" ] && [ "${BRANCH}" = "master" ]; then
    export TAG="latest"
else
    export TAG="dev"
fi

export REVISIONS=$(git rev-list --count ${BRANCH})
export VERSION=0.${REVISIONS}.${BUILD_NUMBER}