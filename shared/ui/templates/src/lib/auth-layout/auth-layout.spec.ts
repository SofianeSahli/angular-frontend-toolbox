import { render, screen } from '@testing-library/angular';
import { UiAuthLayout } from './auth-layout';

describe('ui-auth-layout', () => {
  it('puts the app brand in a complementary panel and the form in the main landmark', async () => {
    await render(
      `<ui-auth-layout>
         <div uiAuthBrand>Olivier · Calme, chaleureux, clair.</div>
         <button uiAuthToolbar>العربية</button>
         <h1>Connexion</h1>
       </ui-auth-layout>`,
      { imports: [UiAuthLayout] },
    );
    expect(screen.getByRole('complementary').textContent).toContain('Olivier');
    expect(screen.getByRole('main').textContent).toContain('Connexion');
    expect(screen.getByRole('button', { name: 'العربية' })).toBeTruthy();
  });
});
