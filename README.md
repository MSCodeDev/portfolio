# MSCode Portfolio

![portfolio](public/meta.png)

A personal portfolio built with Astro and TailwindCSS. Features a home page with a skills overview and timeline, a projects page, and a resume page. All content is data-driven via JSON files in `src/data/`.

## **Stack**  
- [Astro](https://astro.build/)
- [TailwindCSS](https://tailwindcss.com/)
- [Heroicons](https://heroicons.com/)
- [Simple Icons](https://simpleicons.org/)

## **Project structure**
```
public/
src/
├── components/
|    ├── footer.astro
|    ├── glitch.astro
|    ├── logos.astro
|    ├── nav.astro
|    └── skills.astro
├── data/
|    ├── info.json
|    ├── projects.json
|    ├── skills.json
|    ├── technologies.json
|    └── timeline.json
├── layouts/
|    └── Layout.astro
└── pages/
     ├── index.astro
     ├── projects.astro
     └── resume.astro
```

## **Local configuration** 
1. Clone the repo:  
```
git clone https://github.com/MSCodeDev/portfolio
```
2. Install dependencies:
```  
pnpm install
```
3. Start the development server:
```  
pnpm dev
```

## License
This project is licensed under the [MIT License](https://opensource.org/licenses/mit).  