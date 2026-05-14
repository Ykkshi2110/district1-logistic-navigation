const puppeteer = require('puppeteer');

(async () => {
    console.log('Starting puppeteer...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Navigating to http://localhost:8080...');
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle0' });

    // Wait for the map and data to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Taking overview screenshot...');
    await page.screenshot({ path: 'screenshot_overview.png' });

    // 1. Dijkstra
    console.log('Performing Dijkstra...');
    await page.select('#dijk-from', 'DDL');
    await page.select('#dijk-to', 'BITX');
    await page.click('#btn-find-route');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Open accordion
    const dijkAccordionHeader = await page.$('#dijk-algo-details .accordion-header');
    if (dijkAccordionHeader) {
        await dijkAccordionHeader.click();
        await new Promise(resolve => setTimeout(resolve, 500)); // wait for transition
    }
    console.log('Taking Dijkstra screenshot...');
    await page.screenshot({ path: 'screenshot_dijkstra.png' });

    // 2. TSP
    console.log('Performing TSP...');
    const tspTab = await page.$('button[data-tab="tsp"]');
    await tspTab.click();
    
    await page.select('#tsp-depot', 'DDL');
    
    // Select first delivery
    const deliveries = await page.$$('.tsp-delivery');
    if (deliveries.length >= 2) {
        await deliveries[0].select('NTD');
        await deliveries[1].select('BITX');
    }

    await page.click('#btn-solve-tsp');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Open accordion
    const tspAccordionHeader = await page.$('#tsp-algo-details .accordion-header');
    if (tspAccordionHeader) {
        await tspAccordionHeader.click();
        await new Promise(resolve => setTimeout(resolve, 500)); // wait for transition
    }
    console.log('Taking TSP screenshot...');
    await page.screenshot({ path: 'screenshot_tsp.png' });

    // 3. Block
    console.log('Performing Block...');
    const blockTab = await page.$('button[data-tab="block"]');
    await blockTab.click();
    
    // The user has to click on a polyline to block.
    // Instead of simulating map clicks, I'll just screenshot the tab.
    console.log('Taking Block screenshot...');
    await page.screenshot({ path: 'screenshot_block.png' });

    await browser.close();
    console.log('Done capturing screenshots.');
})();
