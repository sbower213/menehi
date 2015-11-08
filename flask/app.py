import os
from flask import Flask, render_template, request, redirect
import stripe

from datetime import timedelta
from flask import make_response, current_app
from functools import update_wrapper

import json
import urllib
import requests


def crossdomain(origin=None, methods=None, headers=None,
                max_age=21600, attach_to_all=True,
                automatic_options=True):
    if methods is not None:
        methods = ', '.join(sorted(x.upper() for x in methods))
    if headers is not None and not isinstance(headers, basestring):
        headers = ', '.join(x.upper() for x in headers)
    if not isinstance(origin, basestring):
        origin = ', '.join(origin)
    if isinstance(max_age, timedelta):
        max_age = max_age.total_seconds()

    def get_methods():
        if methods is not None:
            return methods

        options_resp = current_app.make_default_options_response()
        return options_resp.headers['allow']

    def decorator(f):
        def wrapped_function(*args, **kwargs):
            if automatic_options and request.method == 'OPTIONS':
                resp = current_app.make_default_options_response()
            else:
                resp = make_response(f(*args, **kwargs))
            if not attach_to_all and request.method != 'OPTIONS':
                return resp

            h = resp.headers

            h['Access-Control-Allow-Origin'] = origin
            h['Access-Control-Allow-Methods'] = get_methods()
            h['Access-Control-Max-Age'] = str(max_age)
            if headers is not None:
                h['Access-Control-Allow-Headers'] = headers
            return resp

        f.provide_automatic_options = False
        return update_wrapper(wrapped_function, f)
    return decorator

app = Flask(__name__)
app.config.from_pyfile('keys.cfg')
app.config.from_pyfile('keys.cfg')
app.config['SITE'] = 'https://connect.stripe.com'
app.config['AUTHORIZE_URI'] = '/oauth/authorize'
app.config['TOKEN_URI'] = '/oauth/token'

@app.route('/')
def index():
    return render_template('index.html', key=app.config['PUBLISH_KEY'])

@app.route('/charge', methods=['POST'])
@crossdomain(origin='*')
def charge():
    print 'charge'
    stripe.api_key = app.config['API_KEY']
    
    # Get the credit card details submitted by the form
    amt = request.form['amount']
    token = json.loads(request.form['clientToken'])
    prsn = request.form['person']
    account = request.form['account']

    # Create the charge on Stripe's servers - this will charge the user's card
    try:
        charge = stripe.Charge.create(
        amount=amt, # amount in cents, again
        currency="usd",
        source=token["id"],
        description="To " + prsn,
        destination=account
        )
    except Exception as e:
        print e
        # The card has been declined
        pass
    
    print 'pay'
    stripe.Charge.create(
        amount=amt,
        currency='usd',
        source=token["id"],
        destination=account
    )
    print 'pay done'

@app.route('/authorize')
def authorize():
  site   = app.config['SITE'] + app.config['AUTHORIZE_URI']
  params = {
             'response_type': 'code',
             'scope': 'read_write',
             'client_id': app.config['CLIENT_ID']
           }

  # Redirect to Stripe /oauth/authorize endpoint
  url = site + '?' + urllib.urlencode(params)
  return redirect(url)

@app.route('/oauth/callback')
def callback():
    code   = request.args.get('code')
    data   = {
        'client_secret': app.config['API_KEY'],
        'grant_type': 'authorization_code',
        'code': code
    }

    # Make /oauth/token endpoint POST request
    url = app.config['SITE'] + app.config['TOKEN_URI']
    resp = requests.post(url, params=data)
    print resp.json().get('stripe_user_id')

    # Grab access_token (use this as your user's API key)
    token = resp.json().get('access_token')
    return render_template('callback.html', token=token)

if __name__ == '__main__':
    app.run(debug=True)