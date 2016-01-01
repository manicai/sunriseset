#!/usr/bin/env python
import bs4
import requests
import sys

def extract_cell_time(cell_text):
    return cell_text.split()[0]

def main():
    if len(sys.argv) != 3:
        print >> sys.stderr, 'Usage: extract <month> <year>'
        sys.exit(1)

    month = sys.argv[1]
    year = sys.argv[2]

    url = ('http://www.timeanddate.com/sun/uk/london?month=%s&year=%s' %
           (month, year))

    response = requests.get(url)
    if response.status_code != 200:
        print >> sys.stderr, 'Fetch failed'
        print >> sys.stderr, response.text
        sys.exit(1)

    soup = bs4.BeautifulSoup(response.text, 'html.parser')
    table = soup.find(id='as-monthsun')
    rows = table.tbody.find_all('tr')

    for row in rows:
        try:
            day = row.th.text
        except AttributeError:
            # Fails on row that indicates change of daylight savings
            continue
            
        sunrise = extract_cell_time(row.find_all('td')[0].text)
        sunset = extract_cell_time(row.find_all('td')[1].text)

        print day, month, year, sunrise, sunset

if __name__ == '__main__':
    main()
