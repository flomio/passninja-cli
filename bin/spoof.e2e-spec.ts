// experiemental.e2e-spec.ts
// SELENIUM_PROMISE_MANAGER is disabled in protractor.conf.js to allow use of await/async
import { browser, By, element } from 'protractor';
import { WebElement } from 'selenium-webdriver';
import { spoof } from '../bin/spoof';

require('dotenv').config();

let myElement: WebElement;
let parent: WebElement;

describe('PassNinja Demo App e2e tests.', function() {
  it('opens the dash', async function() {
    await browser.get(' https://move-demo.idcards2go.com/demo/make-pass/dash');
    await browser.sleep(400);
  });

  it('logs in to AWS', async function() {
    myElement = await browser.driver.findElement(
      By.className('mat-dialog-container')
    );
    parent = await myElement.findElement(By.xpath("//button[@color='accent']"));
    await parent.click();
  });

  it('spoofs a apple boarding pass', async function() {
    expect(await spoof('apple')).toBe('done');
  });

  it('spoofs a google scan', async function() {
    expect(await spoof('google')).toBe('done');
  });

  it('Event Ticket Pass shows up on dash', async function() {
    const test = element(
      By.xpath("//*[contains(., '" + 'Ninji Musical' + "')]")
    );
    expect(await test.isPresent()).toBe(true);
  });

  it('Google Pass shows up on dash', async function() {
    const test = element(
      By.xpath("//*[contains(@alt, '" + 'Google Pay Scan' + "')]")
    );
    expect(await test.isPresent()).toBe(true);
  });
});
