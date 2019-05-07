require('dotenv').config();
import * as fs from 'fs';
import * as path from 'path';
import * as AWS from 'aws-sdk';
import template from './cloudform';

const deploy = async () => {
  const NAME = JSON.parse(template).Description;

  const STAGE = process.argv[2] || 'development';

  const StackName = `${NAME}-${STAGE}`;

  console.log(`deploying ${StackName} cloudformation`);

  const CF = new AWS.CloudFormation({
    region: process.env.REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  });

  const params = {
    StackName,
    Capabilities: ['CAPABILITY_NAMED_IAM'],
    Parameters: [
      {
        ParameterKey: 'Stage',
        ParameterValue: STAGE
      }
    ],
    TemplateBody: template
  };

  const date = new Date();
  const year = date.getFullYear();
  const m = date.getMonth() + 1;
  const month = m < 10 ? '0' + m : m;
  const d = date.getDate();
  const day = d < 10 ? '0' + d : d;
  const time = date.getTime();
  const now = `${year}-${month}-${day}-${time}`;

  try {
    const location = path.resolve(__dirname, 'deployments', `${now}.json`);
    fs.writeFileSync(location, template);

    let response: any;

    // response = await CF.validateTemplate({
    //   TemplateBody: template
    // }).promise();

    // response = await CF.updateStack(params).promise();
    // response = await CF.createStack(params).promise();

    // response = await CF.listStackResources({
    //   StackName
    // }).promise()

    // let updating = false
    // let rollback = false

    // for (let stack of response.StackSummaries) {
    //   const exists = new RegExp(StackName).test(JSON.stringify(stack))
    //   const deleted = new RegExp('DELETE').test(JSON.stringify(stack))
    //   updating = updating || (exists && !deleted)
    //   rollback = rollback || new RegExp('ROLLBACK').test(JSON.stringify(stack))
    // }

    // if (rollback) {
    //   console.log('rolled back')
    //   process.exit(1)
    // } else if (updating) {
    //   console.log('updating')
    // } else {
    //   console.log('deploying')
    // }

    console.log(response);
  } catch (err) {
    console.error(`>>> ERROR >>> ${err}`);
  }
};

deploy();
