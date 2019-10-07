// experiemental.e2e-spec.ts
// SELENIUM_PROMISE_MANAGER is disabled in protractor.conf.js to allow use of await/async
import { browser, By, element } from 'protractor';

import { WebElement, until } from 'selenium-webdriver';
import { spoof } from '../bin/spoof';

require('dotenv').config();

//odd workaround for protractor's inability to import normally.

var myElement: WebElement;
var parent: WebElement;

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
    expect(await spoof('appleFlight')).toBe('done');
  });

  it('spoofs an apple coupon scan', async function() {
    expect(await spoof('appleCoupon')).toBe('done');
  });

  it('spoofs an apple loyalty scan', async function() {
    expect(await spoof('appleLoyalty')).toBe('done');
  });

  it('spoofs an apple gift scan', async function() {
    expect(await spoof('appleGift')).toBe('done');
  });

  it('spoofs an apple event scan', async function() {
    expect(await spoof('appleEvent')).toBe('done');
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

  it('Gift Card Pass shows up on dash', async function() {
    const test = element(
      By.xpath("//*[contains(., '" + 'PassNinja Emporium' + "')]")
    );
    expect(await test.isPresent()).toBe(true);
  });

  it('Loyalty Pass shows up on dash', async function() {
    const test = element(
      By.xpath("//*[contains(., '" + 'Ninja Fashionista' + "')]")
    );
    expect(await test.isPresent()).toBe(true);
  });

  it('Coupon Pass shows up on dash', async function() {
    const test = element(
      By.xpath("//*[contains(., '" + 'Ninji Sports' + "')]")
    );
    expect(await test.isPresent()).toBe(true);
  });

  it('Boarding Pass shows up on dash', async function() {
    const test = element(
      By.xpath("//*[contains(., '" + 'Ninja Airlines' + "')]")
    );
    expect(await test.isPresent()).toBe(true);
  });
});
