"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require('dotenv').config();
const AWS = require("aws-sdk");
const cloudform_1 = require("./cloudform");
const deploy = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
    const NAME = JSON.parse(cloudform_1.default).Description;
    const STAGE = process.argv[2] || 'production';
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
        TemplateBody: cloudform_1.default
    };
    try {
        let response;
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
        response = yield CF.updateStack(params).promise();
        // } else {
        //   console.log('deploying')
        //   // response = await CF.createStack(params).promise()
        // }
        console.log(response);
    }
    catch (err) {
        console.error(err);
    }
});
deploy();
//# sourceMappingURL=deploy.js.map