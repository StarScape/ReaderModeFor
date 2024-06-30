import * as React from 'react';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

import express from 'express';
import { jsxHandler } from './templating';
const app = express();
const PORT = 3000;

app.use(express.static('public'));

function MagnifyingGlass() {
  return (
    <svg width="45" height="45" viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg" className="">
      <path d="M89.32 86.5L64.25 61.4C77.2 47 76.75 24.72 62.87 10.87 55.93 3.92 46.7.1 36.87.1s-19.06 3.82-26 10.77C3.92 17.8.1 27.05.1 36.87s3.82 19.06 10.77 26c6.94 6.95 16.18 10.77 26 10.77 9.15 0 17.8-3.32 24.55-9.4l25.08 25.1c.38.4.9.57 1.4.57.52 0 1.03-.2 1.42-.56.78-.78.78-2.05 0-2.83zM36.87 69.63c-8.75 0-16.98-3.4-23.17-9.6-6.2-6.2-9.6-14.42-9.6-23.17 0-8.75 3.4-16.98 9.6-23.17 6.2-6.2 14.42-9.6 23.17-9.6 8.75 0 16.98 3.4 23.18 9.6 12.77 12.75 12.77 33.55 0 46.33-6.2 6.2-14.43 9.6-23.18 9.6z"></path>
    </svg>
  );
}

type BasicLayoutProps = {
  title?: string,
  children: React.ReactNode,
}

function BasicLayout({ title, children }: BasicLayoutProps) {
  return (
    <html>
      <head>
        {title && <title>{title}</title>}
        <link rel="stylesheet" type="text/css" href="app.css" />
      </head>
      <body>
        {children}
        <script src="https://unpkg.com/htmx.org@2.0.0"></script>
      </body>
    </html>
  );
}

function HomePageLayout({ children }: { children: React.ReactNode }) {
  return (
    <BasicLayout
      title="Reader Mode: Static, Shareable Version of the Reader Mode for Any Webpage"
    >
      <div id='content-and-footer'>
        <main>
          {children}
        </main>

        <footer>
          <span style={{flex: 1, marginRight: "0.25em"}}>Made with ♥ by </span>
          <a target="_blank" href="https://github.com/StarScape/">
            <img style={{height: "1.75lh", display: "inline"}} src="img/ja_logo.svg" />
          </a>
          <span>.</span>
        </footer>
      </div>
    </BasicLayout>
  );
}

export function HomePage() {
  return (
    <HomePageLayout>
      <form
        hx-get="/reader"
        hx-target="body"
        hx-select="#reader-content"
        hx-push-url="true"
      >
        <p>Get a static, shareable reader view for any webpage</p>
        <div id="url-input-container">
          <input
            style={{ border: "none" }}
            type="url"
            name="url"
            id="url"
            placeholder="Enter a URL..."
            pattern="https://.*"
            size={30}
            autoFocus
            required
          />
          <button type="submit">
            <MagnifyingGlass />
          </button>
        </div>
        <div id="error" style={{ display: "none" }}></div>
      </form>

      <section>
        <h3>Why?</h3>
        <p>
          Reader mode is now built in to many browsers, but it comes with some limitations.
          In most browsers, you can't <b>print or use browser plugins</b> on the reader mode version of a page,
          and you can't <b>share or save it.</b>
        </p>
        <p>
          ReaderModeFor can take any URL and give you back a clean, readable version that is <b>just a static webpage</b>.
          No limitations! There is also optional permalinking.
        </p>
      </section>

      <section>
        <h3>Notes</h3>
        <p>
          ReaderModeFor uses the <a href="https://github.com/mozilla/readability">Readability</a> library, a standalone version of the code that powers Firefox's reader view.
        </p>
        <p>
          ReaderModeFor may not work perfectly on all webpages.
        </p>
      </section>
    </HomePageLayout>
  );
}

app.get('/', jsxHandler(async (req, res) => {
    return <HomePage />;
}));

async function readerModeFor(url: string) {
  try {
    const req = await fetch(url);
    const htmlSrc = await req.text();

    const doc = new JSDOM(htmlSrc, {
      url: url,
    });
    
    let reader = new Readability(doc.window.document);
    return reader.parse();
  } catch (e) {
    console.log("Error converting page to reader mode:");
    console.log(e);
    return false;
  }
}

function ReaderLayout(props: { title: string, children?: React.ReactNode }) {
  return (
    <BasicLayout title={`Reader Mode for "${props.title}"`}>
      <div id="reader-content-and-controls">
        <div id="left-gutter" className="gutter">
          <div id="reader-controls">
            <button><img src="img/font-solid.svg"/></button>
            <button><img src="img/sun-solid.svg"/></button>
            <button><img src="img/link-solid.svg"/></button>
          </div>
        </div>
        <div id="reader-content">
          <h1>{props.title}</h1>
          <hr />
          {props.children}
        </div>
        <div id="right-gutter" className="gutter">
        </div>
      </div>
    </BasicLayout>
  );
}

app.get('/reader/', jsxHandler(async (req, res) => {
  const url = req.query['url'] as string;
  const readModeResult = await readerModeFor(url);

  // HTMX swap in error if error, otherwise send reader mode page
  if (readModeResult === false) {
    res.setHeader('HX-Retarget', '#error');
    res.setHeader('HX-Reselect', '#error');
    res.setHeader('HX-Reswap', 'outerHTML');
    res.setHeader('HX-Push-Url', 'false');
    return (
      <BasicLayout>
        <div id="error">There was an error converting the page to reader mode. Please make sure it's a valid public URL.</div>
      </BasicLayout>
    );
  } else {
    return (
      <ReaderLayout title={readModeResult.title}>
        <div
          dangerouslySetInnerHTML={{ __html: readModeResult.content }}
        />
      </ReaderLayout>
    );
  }
}));

app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`));
