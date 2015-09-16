#!/bin/bash

#######################################
# Setup
#######################################
# Fail if uninitialized variables are found
set -u
# Exit if any step returns non-true
set -e

#######################################
# Customize these parameters
#######################################
# Include "www" in fully-qualified domain name:
FQDN='www.aldebrn.me'
DAYSVALID=1095

# Use full state, not abbreviations
STATE='Ohio'
CITY='Dayton'
APPNAME='Aldebrn'

# You probably don't need to customize these
KEYLENGTH=4096

#######################################
# make directories to work from
#######################################
mkdir -p certs/{server,client,ca,tmp}

#######################################
# Create your very own Root Certificate Authority
#######################################
openssl genrsa \
  -out certs/ca/my-root-ca.key.pem \
  ${KEYLENGTH}

# Self-sign your Root Certificate Authority
# Since this is private, the details can be as bogus as you like
openssl req \
  -x509 \
  -new \
  -sha256 \
  -nodes \
  -key certs/ca/my-root-ca.key.pem \
  -days 3652 \
  -out certs/ca/my-root-ca.crt.pem \
  -subj "/C=US/ST=Utah/L=Provo/O=ACME Signing Authority Inc/CN=example.com"
# NOTE
# -nodes means "no-des" which means "no passphrase"
# -days 3652 means that this example will break about 10 years from now

#######################################
### Create Certificate for this domain
#######################################
openssl genrsa \
  -out certs/server/my-server.key.pem \
  ${KEYLENGTH}

# Create the CSR
openssl req -new \
  -key certs/server/my-server.key.pem \
  -out certs/tmp/my-server.csr.pem \
  -subj "/C=US/ST=${STATE}/L=${CITY}/O=${APPNAME}/CN=${FQDN}"

#######################################
# Sign the request from Device with your Root CA
#######################################
openssl x509 \
  -req -in certs/tmp/my-server.csr.pem \
  -sha256 \
  -CA certs/ca/my-root-ca.crt.pem \
  -CAkey certs/ca/my-root-ca.key.pem \
  -CAcreateserial \
  -out certs/server/my-server.crt.pem \
  -days ${DAYSVALID}

#######################################
# All done! Give Node's `https` the following:
# key: 'certs/server/my-server.key.pem',
# cert: 'certs/server/my-server.crt.pem'
#######################################


