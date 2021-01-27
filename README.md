# serverless-monday

This tool can be used as a WebHook for Monday.com to assign Auto Incremeted IDs to pulses.
Designed to be deployed on AWS Lambda.
Has a few additional APIs for manual usage.

## Usage

* Create Firebase App
* Attach you Admin credentials in serviceAccountKey.json file
* Setup .env file with:

```text
STAGE=
DEFAULT_PREFIX=
DB_URL=
MONDAY_TOKEN=
```

## Install and setup Serverless

* npm install -g serverless
* sls config credentials --provider aws --key xxx --secret xxx
* npm install --save express serverless-http
* npm install --save express multer 
* npm install serverless-dotenv-plugin --save
* npm install serverless-offline --save
* npm install firebase-admin --save

Deploy using:
* sls deploy

Debug locally using:
* sls offline start

