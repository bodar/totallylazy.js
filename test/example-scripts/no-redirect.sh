#!/usr/bin/env bash
echo one
>&2 echo two
echo three
>&2 echo four
exit 1