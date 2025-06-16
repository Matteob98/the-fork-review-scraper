import { Actor } from 'apify';
import { PuppeteerCrawler } from 'crawlee';
import * as cheerio from 'cheerio';

await Actor.init();

const input = await Actor.getInput();
const { url } = input;

const results = [];

const crawler = new PuppeteerCrawler({
    async requestHandler({ page, request }) {
        await page.goto(request.url, { waitUntil: 'networkidle2' });

        // Attendi che il wrapper delle recensioni sia presente nel DOM
        await page.waitForSelector('div[name="THEFORK"] div[data-testid="review-list-wrapper"] ul');

        // Ottieni l'HTML della pagina
        const html = await page.content();
        const $ = cheerio.load(html);

        // Seleziona il div principale delle recensioni
        const mainDiv = $('div[name="THEFORK"]');
        const reviewWrapper = mainDiv.find('div[data-testid="review-list-wrapper"]');
        const reviewList = reviewWrapper.find('ul');

        // Estrai tutte le recensioni
        reviewList.find('li[data-testid="restaurant-page-review-item"]').each((i, elem) => {
            const $li = $(elem);

            const author = $li.find('cite').first().text().trim();
            const authorReviews = $li.find('cite').parent().find('span').first().text().trim();
            const date = $li.find('p > span').first().text().trim();
            const score = $li.find('div[display="inline-flex"] span').first().text().trim();
            const content = $li.find('div.css-1hdrxx1 p[aria-expanded="true"]').text().trim();

            results.push({
                author,
                authorReviews,
                date,
                score,
                content,
            });
        });
    },
});

await crawler.run([url]);
await Actor.pushData(results);
await Actor.exit();
