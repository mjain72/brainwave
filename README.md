This code allows you to use TGAM Brainwave sensor and visualize the data using python and D3. 

To execute the python code use the following command:

python pyserial_bluetooth.py '/dev/rfcommX'

where X is the number assigned to the serial port, when using Linux system

To start python web server on your local machine use the following command, from the directory where brainwave.html is located :

python -m http.server 8080
