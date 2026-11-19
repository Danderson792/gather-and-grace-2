# Gather & Grace — Thanksgiving Website

A complete, multi-page, responsive Thanksgiving cooking and planning website for an introductory Web Page Development group project. Built with **HTML, CSS, and vanilla JavaScript** and designed for **GitHub Pages**—no backend, database, paid services, build system, or npm install required.

## Website pages

- `index.html` — homepage, overview, next steps.
- `recipes.html` — searchable and filterable collection of seven recipes.
- `recipes/turkey.html` — herb-butter roast turkey.
- `recipes/stuffing.html` — classic sage and onion stuffing.
- `recipes/cranberry-sauce.html` — orange-ginger cranberry sauce.
- `recipes/gravy.html` — make-ahead turkey gravy.
- `recipes/mashed-potatoes.html` — creamy garlic mashed potatoes.
- `recipes/green-bean-casserole.html` — from-scratch green bean casserole.
- `recipes/pumpkin-pie.html` — silky pumpkin pie.
- `guides/turkey-guide.html` — complete thawing, roasting, food-safety and carving guide.
- `guides/prep-ahead.html` — full make-ahead, storage and oven-space guide.
- `guides/substitutions.html` — ingredient substitutions, allergen swaps and alternatives.
- `planner.html` — 4-week prep countdown with 35 saved checklist tasks, and a cooking-day schedule that shifts with the chosen dinner time.
- `calculators.html` — guest estimate, portion scaling, unit and temperature conversions, and pan-area calculator.
- `grocery-list.html` — combined printable list generated from selected recipes.
- `contact.html` — clearly identified demo-only form; **nothing is transmitted or collected**.

## How to preview locally

The simplest option is to open `index.html` in a browser. To test all features using a local server (recommended):

1. Open the extracted `gather-and-grace` folder in VS Code.
2. In the terminal, run `python3 -m http.server 8000` (or use VS Code's Live Server extension).
3. Open `http://localhost:8000/` and test the site on desktop and a narrow mobile viewport.
4. Stop the Python server with `Control-C`.

No installation of frameworks or packages is required for the website itself.

## Publish on GitHub Pages

1. Create a **public GitHub repository**, for example `gather-and-grace`.
2. Upload the **contents** of this project folder to the repository root. The top level should contain `index.html`, `recipes.html`, the `css` folder, `js` folder, etc. Do **not** upload just the ZIP or leave another `gather-and-grace` folder above `index.html`.
3. Commit and push to the `main` branch. For a 3-person group, invite classmates using **Settings → Collaborators** (permissions can vary with organization settings).
4. Go to **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`, and save.
5. GitHub will provide the site URL, typically `https://YOUR-USERNAME.github.io/gather-and-grace/`.
6. Open the published site and verify the recipe/guide links, mobile menu, search, converters, planner, grocery list and print layout.

If your class requires a private repository, confirm that your GitHub plan or organization permits publishing its Pages site.

## How the features work

**Recipes:** Browse seven photo-backed recipes. Search by recipe or ingredient. Filter by course, dietary category and **prep + cooking time**; turkey thawing (and dough chilling) are separately noted and not included in time filtering. Allergy labels reflect the recipes **as written** and cannot guarantee against cross-contact.

**Serving sizes:** The guest-count field is shared across the site. Changing it immediately scales recipe quantities and aggregates them in the shopping list. The initial value is 12 guests, based on the provided recipes' usual 10–12 serving yields. For pumpkin pie, the original makes one pie for 8–10 slices. The scaling is mathematical: buy whole food packages, round up servings/pies as needed and adjust salt, fats and cooking times by judgment.

**Measurement conversion:** Switch volume, weight or temperature with drop-downs. Enter decimals or fractions such as `1 1/2`, `½`, or `0.75`; results update as you type. Celsius/Fahrenheit conversions work in both directions, including below-freezing temperatures. A separate pan-area calculator compares typical baking pans and quantities. **Cups cannot safely convert to grams without choosing a specific ingredient/density**; the calculator keeps weight and volume separate rather than pretending they are equivalent. Pan-area estimates do not guarantee baking times or temperatures.

**Pantry and grocery list:** Click **Add to feast** on recipes. The grocery list combines ingredient quantities and groups them by aisle. Mark items already on hand, filter to items needed and print the list. Shared ingredient names/units are combined where possible. The checklists are tied to ingredient types rather than individually tracked batches, so check quantities in your pantry before treating a shared ingredient as fully covered.

**Planner:** The source-derived 4-week prep timeline has checkboxes that save progress in the browser. The cooking-day schedule uses the provided **4:00 PM dinner / 12–14 lb turkey sample** and shifts entries when the meal time changes. It is an estimate, not a guaranteed safe cooking timetable. Follow the internal temperature guidance and start earlier for bigger birds.

**Contact:** A realistic labeled demo form prevents default submission and displays a success explanation. It **does not send, store or collect any information**.

**Persistence:** Guest count, chosen dishes, pantry items, recipe units and prep checklist are stored with `localStorage`, **only in that browser/device**. Clearing browsing data removes them. No data is synchronized to classmates or visitors.

## Source content and styles

- `content/thanksgiving-website-content.txt` is the **exact uploaded source manuscript**. Full recipe steps, ingredients and cooking notes were used for the seven recipe pages, plus the source guide material and planning schedule.
- `js/data.js` holds the data used for interactive recipe rendering. You can edit names, default servings, prep and cook times, tags, ingredients and method steps there.
- `css/styles.css` is the **site's responsive stylesheet**, using cream, rustic red/orange, gold and green tones. Modify CSS custom properties at the top to change the theme.
- `reference-wireframes/` contains the provided 12 desktop/mobile wireframe SVGs and the uploaded `styles.css` for their **wireframe presentation page**. The uploaded CSS styles `.pair`, `.plan`, and the wireframe sheet's `header`/`main`; applying it to the finished site wholesale would overwrite its layout. It is preserved intact as reference instead.
- `assets/images/*.webp` are **local food illustrations generated for this project** and do not require network image loading.
- `assets/favicon.svg` is a local site icon.

Some source ingredients are expressed as ranges or open-ended amounts (e.g. 3–3½ cups, 3–5 tablespoons, `to taste`, optional drippings). The interactive quantities use a reasonable representative value where necessary and retain the original manuscript for reference. Always check recipe instructions, package labels, doneness, allergen safety and pan capacity rather than relying on automatically scaled amounts alone.

## Accessibility design

The site uses semantic page landmarks, one main page heading per page, labeled inputs, a skip-to-content link, meaningful image alt text, visible keyboard focus, responsive layouts, live result announcements for search and calculators, and reduced-motion support. Keyboard users can operate the navigation, all calculators, lists and demo form. The group should still run a final accessibility review with keyboard testing and a tool such as Lighthouse or axe before submitting. WCAG compliance requires verification, including real-device and assistive-technology checks.

## Suggested group roles

- **Student 1:** Content and recipe QA: compare the seven recipes against `content/thanksgiving-website-content.txt`; verify labels, steps, timing and food-safety language.
- **Student 2:** HTML/CSS, responsive design and accessibility: review all mobile wireframes, navigation, typography, focus and contrast.
- **Student 3:** JavaScript features and deployment: verify the calculators, local storage, shopping list, printer output, and GitHub Pages publishing.

Review each other's changes in GitHub pull requests, and each contributor should test the full published site.

## Quick code check

From this project's root, run `node tests/smoke-test.js` if Node.js is available. This tests recipe records, numerical formatting, fractions, portion scaling, grocery aggregation, and local storage with no extra packages. The project was also checked for valid internal links and JavaScript syntax. End-to-end browser testing should still be performed on GitHub Pages because automated browser navigation was not available in the preparation environment.
