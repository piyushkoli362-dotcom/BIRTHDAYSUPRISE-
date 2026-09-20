import {test,expect} from '@playwright/test';
test('login defaults to password sign in; failed signup remains editable',async({page})=>{
 const calls:string[]=[];
 await page.route('**/api/auth/login',async route=>{
  calls.push('login');await route.fulfill({status:400,json:{error:'Incorrect email or password.'}});
 });
 await page.route('**/api/auth/signup',async route=>{
  calls.push('signup');await route.fulfill({status:429,json:{error:'Confirmation emails are temporarily unavailable.'}});
 });
 await page.goto('/login');
 await expect(page.getByRole('heading',{name:'Welcome back.'})).toBeVisible();
 await page.getByLabel('Email address').fill('ui-test@example.com');
 await page.getByLabel('Password',{exact:true}).fill('Test-password-123');
 await page.locator('form').getByRole('button').click();
 await expect(page.getByText('Incorrect email or password.',{exact:true})).toBeVisible();
 expect(calls).toEqual(['login']);
 await page.getByRole('button',{name:'Create account',exact:true}).click();
 await page.locator('form').getByRole('button').click();
 await expect(page.getByText('Confirmation emails are temporarily unavailable.',{exact:true})).toBeVisible();
 await expect(page.locator('form').getByRole('button')).toBeEnabled();
 expect(calls).toEqual(['login','signup']);
});
test('slow authentication stops waiting and does not automatically retry',async({page})=>{
 let calls=0;
 await page.route('**/api/auth/login',async route=>{calls++;await new Promise(resolve=>setTimeout(resolve,17000));await route.abort().catch(()=>{});});
 await page.goto('/login');
 await page.getByLabel('Email address').fill('ui-test@example.com');
 await page.getByLabel('Password',{exact:true}).fill('Test-password-123');
 await page.locator('form').getByRole('button').click();
 await expect(page.getByText(/The connection is taking too long/)).toBeVisible({timeout:18000});
 await expect(page.locator('form').getByRole('button')).toBeEnabled();
 expect(calls).toBe(1);
});
