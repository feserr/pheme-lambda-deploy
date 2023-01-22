import lambda = require("@aws-cdk/aws-lambda");
import apigw = require("@aws-cdk/aws-apigateway");
import cdk = require("@aws-cdk/core");
import assets = require("@aws-cdk/aws-s3-assets");
import path = require("path");

require('dotenv-flow').config();

export class GoAPILambdaStack extends cdk.Stack {
  constructor(app: cdk.App, id: string) {
    super(app, id);

    // The following Golang example defines an directory
    // asset which is archived as a .zip file and uploaded to
    // S3 during deployment.
    // See https://docs.aws.amazon.com/cdk/api/latest/docs/aws-s3-assets-readme.html
    const myLambdaAsset = new assets.Asset(
      // @ts-ignore - this expects Construct not cdk.Construct :thinking:
      this,
      process.env.LAMBDA_ZIP_NAME || "LambdaFnZip",
      {
        path: path.join(__dirname, process.env.LAMBDA_FOLDER || ""),
        exclude: ["test/*", ".vscode/*", ".github/*", "deploy/*"],
        ignoreMode: cdk.IgnoreMode.GIT
      }
    );

    const lambdaFn = new lambda.Function(this, process.env.LAMBDA_FUNCTION_NAME || "LambdaServerFn", {
      code: lambda.Code.fromBucket(
        myLambdaAsset.bucket,
        myLambdaAsset.s3ObjectKey
      ),
      timeout: cdk.Duration.seconds(300),
      runtime: lambda.Runtime.GO_1_X,
      handler: "main",
      environment: {
        "DATABASE_HOST": process.env.DATABASE_HOST || "",
        "DATABASE_PORT": process.env.DATABASE_PORT || "",
        "POSTGRES_USER": process.env.POSTGRES_USER || "",
        "POSTGRES_PASSWORD": process.env.POSTGRES_PASSWORD || "",
        "POSTGRES_DB": process.env.POSTGRES_DB || ""
      }
    });

    // API Gateway
    new apigw.LambdaRestApi(
      // @ts-ignore - this expects Construct not cdk.Construct :thinking:
      this,
      process.env.ENDPOINT_NAME || "LambdaEndpoint",
      {
        handler: lambdaFn,
      }
    );
  }
}

const app = new cdk.App();
new GoAPILambdaStack(app, process.env.LAMBDA_FUNCTION_NAME || "LambdaServerFn");
app.synth();
