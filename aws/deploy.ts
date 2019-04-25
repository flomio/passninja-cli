require('dotenv').config()

import * as AWS from 'aws-sdk'

import template from './cloudform'

const deploy = async () => {
  const NAME = JSON.parse(template).Description

  const STAGE = process.argv[2] || 'production'

  const StackName = `${NAME}-${STAGE}`

  console.log(`deploying ${StackName} cloudformation`)

  const CF = new AWS.CloudFormation({
    region: process.env.REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  })

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
  }

  try {
    let response: any

    // response = await CF.validateTemplate({
    //   TemplateBody: template
    // }).promise()

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
    response = await CF.updateStack(params).promise()
    // } else {
    //   console.log('deploying')
    //   // response = await CF.createStack(params).promise()
    // }

    console.log(response)
  } catch (err) {
    console.error(err)
  }
}

deploy()
