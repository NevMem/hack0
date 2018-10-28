import pyqrcode
import sys

url = sys.argv[1]
pin = sys.argv[2]
i = 0
if len(sys.argv) > 3: 
	i = sys.argv[3]

big_code = pyqrcode.create(url + pin)
big_code.png('tmp/' + pin + '.png', scale = 18)