# Projektvision: Mach dir deinen Bundestag

## Ausgangslage

„Mach dir deinen Bundestag“ ist als Lern- und Experimentierprojekt entstanden. Es verbindet drei Ziele:

1. praktische Erfahrung mit React und TypeScript sammeln,
2. den Einsatz von LLMs bei Konzeption und Softwareentwicklung erproben,
3. politische Wahldaten auf eine interaktive und verständliche Weise erfahrbar machen.

Der bestehende Prototyp kann bereits Wahldaten filtern, daraus eine Sitzverteilung berechnen, einen Bundestag visualisieren und mögliche Mehrheitskoalitionen anzeigen. Die aktuelle Anwendung ist jedoch noch nicht als abgeschlossenes Produkt zu verstehen. Datenbereitstellung, fachliche Absicherung, Codequalität und insbesondere die Benutzeroberfläche müssen überarbeitet werden.

Dieses Dokument beschreibt das gemeinsame Zielbild für die weitere Entwicklung. Es soll als Orientierung für Produktentscheidungen, UI-Entwürfe, Refactorings und spätere Implementierungsschritte dienen.

## Produktidee

Die Anwendung ermöglicht es Nutzerinnen und Nutzern, ein Wahlergebnis aus verschiedenen gesellschaftlichen und geografischen Perspektiven zu betrachten.

Ausgangspunkt sind reale Wahldaten. Durch das Ein- oder Ausschließen bestimmter Gruppen kann untersucht werden, wie sich ein Bundestag zusammensetzen würde, wenn nur ausgewählte Teile des Elektorats berücksichtigt würden.

Beispiele:

- Wie sähe der Bundestag aus, wenn nur Menschen unter 35 Jahren gewählt hätten?
- Wie verändert sich die Sitzverteilung ohne einzelne Bundesländer?
- Welche Unterschiede ergeben sich zwischen Briefwahl und Urnenwahl?
- Wie unterscheiden sich die Ergebnisse von Männern und Frauen bestimmter Altersgruppen?
- Welche Koalitionen hätten in einem gefilterten Szenario eine Mehrheit?

Die Anwendung ist kein Wahlprognosewerkzeug und soll keine politischen Empfehlungen geben. Sie ist ein interaktives Analyse- und Lernwerkzeug, das Zusammenhänge sichtbar macht.

## Zentrales Produktversprechen

> Nutzerinnen und Nutzer können mit wenigen, verständlichen Interaktionen ein eigenes Wahlszenario zusammenstellen und sofort erkennen, wie sich dieses auf Stimmenanteile, Sitzverteilung und mögliche Mehrheiten im Bundestag auswirkt.

Die Anwendung soll dabei drei Eigenschaften vereinen:

- **verständlich:** Auch ohne Kenntnisse des Wahlrechts oder der Datenanalyse soll die Bedienung nachvollziehbar sein.
- **unmittelbar:** Änderungen an Filtern sollen direkt und sichtbar auf das Ergebnis wirken.
- **transparent:** Datenbasis, Annahmen, Berechnungsregeln und Einschränkungen müssen klar benannt werden.

## Zielgruppe

Die Anwendung richtet sich vor allem an:

- politisch interessierte Menschen, die Wahlergebnisse explorativ untersuchen möchten,
- Schülerinnen, Schüler, Studierende und Lehrkräfte,
- Menschen, die regionale und demografische Unterschiede besser verstehen möchten,
- Entwicklerinnen und Entwickler, die das Projekt als Beispiel für datengetriebene React-Anwendungen betrachten,
- die Projektentwicklung selbst als Lernumgebung für TypeScript, UI-Architektur und den sinnvollen Einsatz von LLMs.

Die Anwendung soll keine Fachsoftware für Wahlforschung ersetzen. Sie muss jedoch fachlich plausibel, reproduzierbar und ehrlich hinsichtlich ihrer Grenzen sein.

## Gewünschtes Nutzererlebnis

Beim Öffnen der Anwendung soll sofort verständlich sein:

- was untersucht werden kann,
- welche Daten aktuell ausgewählt sind,
- wie Filter verändert werden,
- welches Ergebnis daraus entsteht,
- wie das Ergebnis einzuordnen ist.

Die Oberfläche soll nicht wie ein technisches Dashboard aus einzelnen, gleichgewichteten Diagrammen wirken. Stattdessen soll sie eine klare Geschichte erzählen:

1. **Szenario zusammenstellen**
2. **Ergebnis verstehen**
3. **Mehrheiten und Unterschiede untersuchen**

Die wichtigste Information ist die resultierende Zusammensetzung des Bundestags. Filter und ergänzende Auswertungen unterstützen dieses Ergebnis, sollen es aber nicht visuell überlagern.

## Kernablauf

### 1. Ausgangsszenario

Beim Start wird das vollständige zugrunde liegende Wahlergebnis angezeigt. Die Anwendung nennt sichtbar:

- Wahljahr,
- verwendete Stimmenart,
- Datenquelle,
- zugrunde liegendes Wahlrecht beziehungsweise Berechnungsmodell,
- Gesamtzahl der berücksichtigten Stimmen,
- Status „ungefiltertes Ergebnis“.

### 2. Filter anwenden

Nutzerinnen und Nutzer können Gruppen über eine verständliche Filteroberfläche ein- oder ausschließen.

Vorgesehene Filterdimensionen:

- Bundesland,
- Alter beziehungsweise Altersgruppe,
- Geschlecht entsprechend der verfügbaren Datengrundlage,
- Briefwahl oder Urnenwahl,
- später optional weitere Dimensionen, sofern belastbare Daten vorliegen.

Jede Interaktion muss klar zeigen, ob eine Gruppe aktuell berücksichtigt oder ausgeschlossen wird. Ausgeschlossene Gruppen dürfen nicht nur durch eine schwer interpretierbare Farbänderung erkennbar sein.

### 3. Aktives Szenario prüfen

Alle aktiven Filter werden als verständliche Zusammenfassung angezeigt, zum Beispiel:

- „Bayern ausgeschlossen“
- „18–24 Jahre berücksichtigt“
- „nur Briefwahl“

Einzelne Filter können direkt entfernt werden. Zusätzlich gibt es eine zentrale Aktion „Alle Filter zurücksetzen“.

Die Anwendung zeigt, wie viele Stimmen beziehungsweise welcher Anteil der Datenbasis im aktuellen Szenario berücksichtigt wird.

### 4. Ergebnis untersuchen

Nach jeder Änderung werden mindestens folgende Ergebnisse aktualisiert:

- Stimmenanteile der Parteien,
- Sitzverteilung,
- Gesamtzahl der Sitze,
- Mehrheitsgrenze,
- mögliche minimale Mehrheitskoalitionen.

Die Übergänge sollen ruhig und nachvollziehbar sein. Änderungen dürfen nicht durch springende Layouts oder überladene Animationen unübersichtlich werden.

## Informationsarchitektur und UI-Zielbild

### Kopfbereich

Der Kopfbereich enthält:

- Projekttitel,
- eine kurze Erklärung in einem Satz,
- Wahljahr und Datenstand,
- einen gut auffindbaren Link zu Methodik und Datenquellen.

### Hauptbereich: Ergebnis

Das zentrale Element ist die Sitzverteilung im Bundestag. Sie soll groß, klar und gut beschriftet dargestellt werden.

Ergänzend werden angezeigt:

- Partei,
- Sitzanzahl,
- Stimmenanteil,
- Veränderung gegenüber dem ungefilterten Ausgangsszenario,
- Mehrheitsmarke.

Die Darstellung soll auch ohne alleinige Abhängigkeit von Parteifarben verständlich sein. Farben müssen ausreichend kontrastreich und zugänglich verwendet werden.

### Filterbereich

Der Filterbereich soll auf großen Bildschirmen als klar abgegrenzte Seitenleiste oder als strukturierter Bereich oberhalb des Ergebnisses erscheinen. Auf kleinen Bildschirmen kann er als ausklappbares Panel oder Drawer umgesetzt werden.

Die Filter werden in verständliche Gruppen gegliedert:

- Region,
- Alter und Geschlecht,
- Wahlart.

Die Deutschlandkarte bleibt als visuelles Auswahlwerkzeug erhalten, wird aber durch Beschriftung, Legende und eine alternative zugängliche Liste der Bundesländer ergänzt.

Das Alters- und Geschlechtsdiagramm kann als interaktives Filterelement erhalten bleiben, sofern Auswahlzustände eindeutig, tastaturbedienbar und verständlich sind. Eine klassische Formularalternative soll verfügbar sein.

### Koalitionsbereich

Koalitionen werden unterhalb des Hauptergebnisses dargestellt. Die Liste soll nicht jede mathematisch mögliche Kombination ungeordnet zeigen, sondern verständlich priorisieren.

Mindestens dargestellt werden:

- beteiligte Parteien,
- gemeinsame Sitzanzahl,
- Abstand zur Mehrheitsgrenze,
- grafische Zusammensetzung,
- Kennzeichnung, ob es sich um eine minimale Mehrheitskoalition handelt.

CDU und CSU können für Koalitionsdarstellungen als gemeinsame Union behandelt werden, während die zugrunde liegenden Sitzdaten weiterhin nachvollziehbar bleiben.

## Fachlicher Funktionsumfang

### Stimmenaggregation

Die Anwendung aggregiert die Stimmen aller Datensätze, die den aktiven Filtern entsprechen. Aus den aggregierten Stimmen werden Parteiergebnisse und Prozentanteile berechnet.

Die Berechnung muss auch folgende Zustände sauber behandeln:

- keine aktiven Filter,
- sehr kleine verbleibende Datenmengen,
- vollständig herausgefilterte Daten,
- Parteien ohne Stimmen im aktuellen Szenario,
- unbekannte oder nicht zuordenbare Parteieinträge.

### Sitzberechnung

Die Sitzverteilung soll in einem eigenständigen, testbaren Fachmodul erfolgen. UI-Komponenten dürfen die Berechnungslogik nicht selbst implementieren.

Das Modul muss explizit dokumentieren:

- Zahl der zu verteilenden Sitze,
- verwendetes Zuteilungsverfahren,
- Sperrklausel,
- Behandlung von Direktmandaten,
- Behandlung von Parteien nationaler Minderheiten,
- Behandlung von CDU und CSU,
- Umgang mit Rundung und Gleichständen.

Das Ziel ist nicht nur ein visuell plausibles Ergebnis. Für definierte Referenzdaten muss die Berechnung reproduzierbare und fachlich geprüfte Ergebnisse liefern.

### Koalitionsberechnung

Die Koalitionslogik soll von der Darstellung getrennt und mit Tests abgesichert werden.

Standardmäßig sollen minimale Mehrheitskoalitionen berechnet werden. Eine Koalition ist dabei minimal, wenn sie die Mehrheit erreicht, aber nach Entfernen einer beteiligten Partei keine Mehrheit mehr besitzt.

Die Ergebnisse sollen:

- keine Duplikate enthalten,
- stabil sortiert sein,
- eine nachvollziehbare Mehrheitsgrenze verwenden,
- optional nach Zahl der Parteien oder Größe der Mehrheit sortierbar sein.

## Datenbasis

Die Anwendung basiert auf aufbereiteten Wahldaten. Die Datenaufbereitung erfolgt außerhalb der React-Anwendung, derzeit über Python beziehungsweise Jupyter-Notebooks.

Langfristig soll ein reproduzierbarer Datenprozess entstehen:

1. Rohdaten aus dokumentierten offiziellen Quellen beziehen,
2. Daten in ein klar definiertes internes Format überführen,
3. Konsistenz und Summen prüfen,
4. die für die Anwendung benötigten Dateien erzeugen,
5. die erzeugten Daten versionieren oder reproduzierbar beim Build bereitstellen.

Die Anwendung darf nicht davon abhängen, dass nur auf einem einzelnen lokalen Rechner vorhandene Dateien manuell kopiert werden.

Für jede verwendete Datei müssen Herkunft, Wahljahr, Erzeugungsweg und bekannte Einschränkungen dokumentiert sein.

### Umgang mit unvollständigen demografischen Daten

Falls Stimmen auf demografische Gruppen verteilt oder angenähert werden müssen, ist dies deutlich als Modellierung zu kennzeichnen. Die Anwendung darf angenäherte Werte nicht als exakt beobachtete Einzeldaten darstellen.

Methodische Annahmen gehören in eine eigene Methodikseite und in die Entwicklerdokumentation.

## Technisches Zielbild

### Grundprinzipien

Der Code soll weiterhin als gut verständliches Lernprojekt lesbar bleiben. Abstraktionen sollen dort eingesetzt werden, wo sie Klarheit schaffen, nicht um eine unnötig komplexe Architektur zu erzeugen.

Wichtige Prinzipien:

- fachliche Logik in reinen TypeScript-Modulen,
- UI-Komponenten mit klar begrenzter Verantwortung,
- serialisierbarer Filterzustand statt gespeicherter Callback-Funktionen,
- abgeleitete Werte möglichst berechnen statt redundant im State speichern,
- starke Typisierung ohne vermeidbares `any`,
- aussagekräftige Namen und kleine, testbare Funktionen,
- keine produktiven Debug-Ausgaben,
- dokumentierte Datenverträge.

### Vorgeschlagene fachliche Bereiche

Eine mögliche Struktur ist:

- `domain/election`: Wahldaten, Aggregation und Ergebnistypen,
- `domain/filters`: Filterdefinitionen und Filterauswertung,
- `domain/parliament`: Sitz- und Mehrheitsberechnung,
- `data`: Laden und Validieren aufbereiteter Daten,
- `features/filters`: Filteroberfläche,
- `features/results`: Parlament, Parteien und Ergebnisvergleich,
- `features/coalitions`: Koalitionsdarstellung,
- `shared`: wiederverwendbare UI- und Hilfsfunktionen.

Diese Struktur ist ein Leitbild und keine starre Vorgabe. Entscheidend ist eine erkennbare Trennung zwischen Daten, Fachlogik und Darstellung.

### Filtermodell

Filter sollen als Daten beschrieben werden, beispielsweise:

```ts
interface ElectionFilter {
  dimension: "state" | "ageGroup" | "gender" | "electionMethod";
  mode: "include" | "exclude";
  values: string[];
}
```

Dadurch werden folgende Funktionen möglich:

- aktive Filter verständlich darstellen,
- Szenarien über eine URL teilen,
- Filter speichern und wiederherstellen,
- Tests ohne UI ausführen,
- Auswertungen und Telemetrie später nachvollziehbar gestalten.

## Gestaltung und visuelle Sprache

Die neue UI soll modern, ruhig und inhaltlich fokussiert wirken. Sie soll weder wie ein generisches Bootstrap-Dashboard noch wie eine überladene Nachrichtengrafik erscheinen.

### Gestaltungsprinzipien

- klare visuelle Hierarchie,
- großzügige Abstände,
- begrenzte Anzahl gleichzeitig konkurrierender Elemente,
- gut lesbare Typografie,
- neutrale Grundfarben und gezielter Einsatz von Parteifarben,
- konsistente Komponenten und Zustände,
- verständliche Beschriftungen auf Deutsch,
- responsive Gestaltung für Desktop, Tablet und Smartphone,
- barrierearme Bedienung und ausreichende Kontraste.

### Interaktionsprinzipien

- Auswahlzustände sind eindeutig beschriftet,
- jede Aktion besitzt eine sichtbare Rückmeldung,
- Filter sind per Maus, Tastatur und Touch bedienbar,
- Diagramme sind keine alleinige Informationsquelle,
- Tooltips ergänzen Informationen, ersetzen aber keine Beschriftung,
- leere oder ungültige Szenarien werden erklärt,
- Reset und Rückkehr zum Ausgangsergebnis sind jederzeit möglich.

## Transparenz und Einordnung

Politische Daten benötigen eine besonders klare Einordnung. Die Anwendung soll sichtbar erklären:

- dass gefilterte Ergebnisse hypothetische Szenarien sind,
- dass demografische Daten je nach Quelle modelliert oder aggregiert sein können,
- welches Wahljahr dargestellt wird,
- welches Wahlrecht modelliert wird,
- warum Ergebnisse von offiziellen Sitzverteilungen abweichen können,
- dass die Anwendung keine Prognose und keine Wahlempfehlung darstellt.

Ein eigener Bereich „Methodik und Daten“ soll diese Informationen ausführlich zugänglich machen.

## Barrierefreiheit

Die Anwendung soll grundlegende Anforderungen barrierearmer Webanwendungen erfüllen:

- semantische Überschriftenstruktur,
- vollständige Tastaturbedienbarkeit,
- sichtbare Fokuszustände,
- sinnvolle Alternativtexte und Beschreibungen für Grafiken,
- ausreichende Farbkontraste,
- keine Information ausschließlich über Farbe,
- verständliche Formularelemente und Beschriftungen,
- Unterstützung reduzierter Bewegung,
- sinnvolle Darstellung bei Vergrößerung und auf kleinen Viewports.

## Qualität und Nachvollziehbarkeit

### Tests

Mindestens folgende Bereiche sollen automatisiert getestet werden:

- Kombination mehrerer Filter,
- Stimmenaggregation,
- Prozentberechnung,
- Sitzverteilung für bekannte Referenzfälle,
- Sperrklausel und Ausnahmen,
- Gesamtzahl der Sitze,
- minimale Mehrheitskoalitionen,
- CDU/CSU-Zusammenführung,
- Verhalten bei leeren Ergebnissen,
- Datenvalidierung.

### Automatisierte Prüfungen

Für jeden Pull Request sollen mindestens ausgeführt werden:

- TypeScript-Build,
- Linting,
- Unit-Tests.

Ein frischer Checkout muss ohne lokal vorhandene Sonderdateien reproduzierbar installierbar und baubar sein.

### Dokumentation

Die README soll künftig mindestens enthalten:

- Zweck des Projekts,
- Screenshots oder eine kurze Produktdarstellung,
- lokale Einrichtung,
- Datenbereitstellung,
- verfügbare Skripte,
- Architekturüberblick,
- fachliche Annahmen,
- bekannte Einschränkungen.

## Nicht-Ziele der ersten überarbeiteten Version

Die erste stabile Version soll bewusst begrenzt bleiben. Zunächst nicht erforderlich sind:

- Echtzeitprognosen oder Umfragedaten,
- individuelle Wahlberatung,
- Simulation strategischen Wahlverhaltens,
- Benutzerkonten,
- dauerhafte Speicherung persönlicher Szenarien auf einem Server,
- ein eigenes Backend, sofern statische Daten ausreichen,
- vollständige wissenschaftliche Wahlforschungssoftware,
- Unterstützung beliebig vieler Wahljahre vor Abschluss eines stabilen ersten Datenmodells.

## Definition einer erfolgreichen ersten stabilen Version

Die erste stabile Version gilt als erreicht, wenn:

1. ein frischer Checkout reproduzierbar installiert und gebaut werden kann,
2. Datenquelle und Datenaufbereitung dokumentiert sind,
3. das ungefilterte Referenzergebnis nachvollziehbar berechnet wird,
4. zentrale fachliche Regeln durch automatisierte Tests abgesichert sind,
5. Bundesland, Alter, Geschlecht und Wahlart verständlich gefiltert werden können,
6. aktive Filter eindeutig sichtbar und vollständig zurücksetzbar sind,
7. Sitzverteilung und minimale Mehrheitskoalitionen korrekt aktualisiert werden,
8. die Oberfläche auf Desktop und Smartphone klar bedienbar ist,
9. die wichtigsten Inhalte auf Deutsch konsistent beschriftet sind,
10. Methodik, Annahmen und Einschränkungen innerhalb der Anwendung zugänglich sind.

## Empfohlene Entwicklungsphasen

### Phase 1: Projekt stabilisieren

- fehlende beziehungsweise generierte Datendateien klären,
- reproduzierbaren Build herstellen,
- offensichtliche TypeScript- und Laufzeitfehler beheben,
- Debug-Code entfernen,
- bestehende fachliche Logik mit Referenztests absichern.

### Phase 2: Fachmodell und Code strukturieren

- Filter als serialisierbare Daten modellieren,
- Aggregation, Sitzverteilung und Koalitionen aus UI-Komponenten herauslösen,
- Datenverträge definieren und validieren,
- abgeleiteten State vereinfachen.

### Phase 3: UI und Nutzerführung neu gestalten

- Informationsarchitektur festlegen,
- visuelles Designsystem definieren,
- responsive Hauptansicht umsetzen,
- Filterzustände und Ergebnisvergleich verständlich gestalten,
- Barrierefreiheit berücksichtigen.

### Phase 4: Dokumentation und Veröffentlichung

- Methodikseite und README fertigstellen,
- CI einrichten,
- statisches Deployment konfigurieren,
- bekannte Einschränkungen dokumentieren,
- erste stabile Version veröffentlichen.

## Offene Produktentscheidungen

Vor oder während der Umsetzung müssen noch einige Fragen bewusst entschieden werden:

- Soll die Anwendung zunächst ausschließlich die Bundestagswahl 2021 abbilden?
- Welches Wahlrecht wird als Referenz verwendet und wie wird es benannt?
- Werden Filter standardmäßig als Einschluss oder Ausschluss verstanden?
- Welche demografischen Werte sind exakt und welche modelliert?
- Sollen Ergebnisse immer mit dem vollständigen Wahlergebnis verglichen werden?
- Sollen nur minimale Mehrheitskoalitionen oder optional alle Mehrheiten angezeigt werden?
- Werden generierte JSON-Dateien eingecheckt oder reproduzierbar im Build erzeugt?
- Welcher Umfang an Erläuterungen gehört direkt in die Hauptansicht und welcher auf die Methodikseite?

Diese Entscheidungen sollen dokumentiert werden, damit fachliches Verhalten und UI nicht zufällig aus einzelnen Implementierungsdetails entstehen.

## Leitgedanke für die weitere Entwicklung

Das Projekt soll seinen Charakter als Lern- und Experimentierprojekt behalten, aber zugleich den Schritt von einem technisch funktionierenden Prototyp zu einer verständlichen, reproduzierbaren und vertrauenswürdigen Anwendung machen.

Neue Funktionen sind erst dann wertvoll, wenn die vorhandenen Funktionen klar bedienbar, fachlich nachvollziehbar und technisch wartbar sind. Die weitere Entwicklung priorisiert deshalb zunächst Stabilität, Verständlichkeit und ein überzeugendes Nutzererlebnis.