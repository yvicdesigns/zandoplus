package com.zandoplus.app;

import com.getcapacitor.BridgeActivity;

// Les marges des barres système (statut + navigation à 3 boutons) sont gérées
// par le plugin SystemBars de Capacitor 8 et par le CSS de l'app
// (--sa-top / --sa-bottom, voir index.css).
//
// On avait ici un WindowInsetsListener qui posait un padding sur le WebView et
// consommait les insets (Android 15+). Sur les WebView récents (>= 140, ex.
// Galaxy M36 sous Android 15) ce padding est ignoré par Chromium ET les insets
// consommés n'arrivaient plus au WebView : env(safe-area-inset-*) valait 0 et la
// barre du bas de l'app passait sous les 3 boutons Android. Ne pas le remettre.
public class MainActivity extends BridgeActivity {}
