#!/usr/bin/env python
import bs4
import requests
import sys

def extract_cell_time(cell_text):
    return cell_text.split()[0]

def dump_month(month, year):
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

        print "%s,%s,%s,%s,%s" % (day, month, year, sunrise, sunset)


def main():
    if len(sys.argv) != 3 and len(sys.argv) != 5:
        print >> sys.stderr, 'Usage: extract <month> <year> <end_month> <end_year>'
        print >> sys.stderr, '  end_month and end_year are optional.'
        sys.exit(1)

    month = int(sys.argv[1])
    year = int(sys.argv[2])

    if len(sys.argv) == 5:
        end_month = int(sys.argv[3])
        end_year = int(sys.argv[4])
    else:
        end_month = month
        end_year = year

    print "Day,Month,Year,Sunrise,Sunset"
    while year < end_year or (year == end_year and month <= end_month):
        dump_month(month, year)
        month += 1
        if month == 13:
            month = 1
            year += 1

if __name__ == '__main__':
    main()
