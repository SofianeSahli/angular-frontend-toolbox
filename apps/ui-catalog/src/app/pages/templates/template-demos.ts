import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiAmount, UiButton, UiIcon, UiInput } from '@shared/ui-atoms';
import { UiFormField, UiStat } from '@shared/ui-molecules';
import { UiBottomTabs, UiRailItem, UiSideRail, UiTab, UiTabAction, UiTopBar } from '@shared/ui-organisms';
import { UiAppShell, UiAuthLayout, UiFlowLayout, UiPage, UiPageAside } from '@shared/ui-templates';
import { CatalogToolbar } from '../../shell/catalog-toolbar';

@Component({
  selector: 'app-app-shell-demo',
  imports: [UiAppShell, UiSideRail, UiRailItem, UiTopBar, UiBottomTabs, UiTab, UiTabAction, UiPage, UiStat, UiAmount, UiButton, UiIcon, CatalogToolbar],
  template: `<ui-app-shell>
      <ui-side-rail uiShellRail ariaLabel="Navigation principale">
        <strong uiRailBrand>Olivier</strong>
        <button uiRailAction uiButton variant="primary"><ui-icon name="plus" />Ajouter</button>
        <a uiRailItem href="#accueil" aria-current="page"><ui-icon name="house" />Accueil</a>
        <a uiRailItem href="#operations"><ui-icon name="repeat" />Opérations</a>
        <span uiRailFooter>Sofiane</span>
      </ui-side-rail>
      <ui-top-bar uiShellTop title="Accueil" />
      <ui-bottom-tabs uiShellTabs ariaLabel="Navigation principale">
        <a uiTab href="#accueil" aria-current="page"><ui-icon name="house" />Accueil</a>
        <a uiTab href="#operations"><ui-icon name="repeat" />Opérations</a>
        <button uiTabAction aria-label="Ajouter une dépense"><ui-icon name="plus" /></button>
      </ui-bottom-tabs>
      <ui-page title="Novembre 2026" eyebrow="Carnet du foyer">
        <ui-stat label="Reste à dépenser" size="hero" tone="accent"><ui-amount [millimes]="1843000" display="rounded" /></ui-stat>
      </ui-page>
    </ui-app-shell>
    <app-catalog-toolbar floating />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellDemo {}

@Component({
  selector: 'app-page-demo',
  imports: [UiPage, UiPageAside, UiButton, CatalogToolbar],
  template: `<ui-page title="Opérations" eyebrow="Carnet du foyer">
      <button uiPageActions uiButton variant="primary">Ajouter une dépense</button>
      <p>Le contenu principal de la page occupe deux tiers de la largeur.</p>
      <div uiPageAside>À surveiller : Alimentation 89 %.</div>
    </ui-page>
    <app-catalog-toolbar floating />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageDemo {}

@Component({
  selector: 'app-auth-demo',
  imports: [UiAuthLayout, UiFormField, UiInput, UiButton, CatalogToolbar],
  template: `<ui-auth-layout>
      <div uiAuthBrand>
        <strong>Olivier</strong>
        <p>Calme, chaleureux, clair.</p>
      </div>
      <button uiAuthToolbar uiButton variant="ghost" size="sm">العربية</button>
      <h1>Connexion</h1>
      <ui-form-field label="E-mail"><input uiInput type="email" /></ui-form-field>
      <ui-form-field label="Mot de passe"><input uiInput type="password" /></ui-form-field>
      <button uiButton variant="primary">Se connecter</button>
    </ui-auth-layout>
    <app-catalog-toolbar floating />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthDemo {}

@Component({
  selector: 'app-flow-demo',
  imports: [UiFlowLayout, UiFormField, UiInput, UiButton, CatalogToolbar],
  template: `<ui-flow-layout title="Créer votre foyer" lead="Vous pourrez inviter les membres ensuite." [step]="1" [steps]="2">
      <ui-form-field label="Nom du foyer" hint="Visible par les membres."><input uiInput /></ui-form-field>
      <button uiFlowFooter uiButton variant="primary" size="lg">Continuer</button>
    </ui-flow-layout>
    <app-catalog-toolbar floating />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowDemo {}
