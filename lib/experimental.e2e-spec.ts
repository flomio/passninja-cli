// experiemental.e2e-spec.ts

import {
  browser,
  element,
  by,
  By,
  $,
  $$,
  ExpectedConditions
} from 'protractor';

import { WebElement, until } from 'selenium-webdriver';
import { spoof } from '../bin/spoof';
require('dotenv').config();

//odd workaround for protractor's inability to import normally.

var myElement: WebElement;
var parent: WebElement;

describe('PassNinja Demo App e2e tests.', function() {
  it('opens the dash', function() {
    browser.get(' https://move-demo.idcards2go.com/demo/make-pass/dash');
    browser.sleep(500);
  });

  it('logs in to AWS', function() {
    //seperating condition out from the wait call makes this work.  -stackoverflow

    browser.sleep(1000);

    myElement = browser.driver.findElement(
      By.className('mat-dialog-container')
    );
    parent = myElement.findElement(By.xpath("//button[@color='accent']"));
    parent.click();
  });

  it('sends a spoof google scan', function() {
    spoof('google').then(
      (spoof: any) => console.log(spoof.topic, spoof.message),
      (err: Error) => console.error(err)
    );
  });

  it('loads one dash element on the dash page', function() {

    browser.sleep(4000);
    const condition3 = until.elementLocated(By.className('dash'));
    browser.driver.wait(
      async driver => condition3.fn(driver),
      10000,
      'Dash Page Elements Should Load Successfully.'
    );
  });

});
