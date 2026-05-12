#!/usr/bin/env node
/* eslint-disable */
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const PROTO_DIR = path.join(ROOT, 'libs/proto/src/proto');
const OUT_DIR = path.join(ROOT, 'libs/proto/src/generated');

fs.mkdirSync(OUT_DIR, { recursive: true });

const protoFiles = fs
  .readdirSync(PROTO_DIR)
  .filter((f) => f.endsWith('.proto'))
  .map((f) => path.join(PROTO_DIR, f));

if (protoFiles.length === 0) {
  console.error('No .proto files found in', PROTO_DIR);
  process.exit(1);
}

const protocBin = path.join(ROOT, 'node_modules/grpc-tools/bin/protoc.js');
const tsProtoPlugin = path.join(
  ROOT,
  'node_modules/.bin/protoc-gen-ts_proto',
);

const args = [
  protocBin,
  `--plugin=protoc-gen-ts_proto=${tsProtoPlugin}`,
  `--ts_proto_out=${OUT_DIR}`,
  '--ts_proto_opt=nestJs=true,addGrpcMetadata=true,outputServices=grpc-js,esModuleInterop=true,useOptionals=messages,fileSuffix=.pb,unrecognizedEnum=false',
  `--proto_path=${PROTO_DIR}`,
  ...protoFiles,
];

const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log('Proto generation complete →', OUT_DIR);
