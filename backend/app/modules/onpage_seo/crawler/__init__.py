"""On-Page SEO crawler package.

Components:
  * ``parser`` — HTML/DOM parsing with BeautifulSoup + lxml.
  * ``sitemap`` — sitemap.xml / sitemap index processing.
  * ``robots`` — robots.txt parsing and rule evaluation.
  * ``extractor`` — orchestrates parse → structured SEO data.
  * ``crawler`` — BFS/DFS traversal engine.
  * ``scheduler`` — APScheduler jobs for periodic crawls.
"""
