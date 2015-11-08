import os
from flask import Flask, render_template, request
import stripe

from datetime import timedelta
from flask import make_response, current_app
from functools import update_wrapper

import json

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

@app.route('/')
def index():
    return render_template('index.html', key=app.config['PUBLISH_KEY'])

@app.route('/charge', methods=['POST'])
@crossdomain(origin='*')
def charge():
    stripe.api_key = app.config['API_KEY']
    
    # Get the credit card details submitted by the form
    amt = request.form['amount']
    token = json.loads(request.form['clientToken'])
    prsn = request.form['person']

    # Create the charge on Stripe's servers - this will charge the user's card
    try:
        charge = stripe.Charge.create(
        amount=amt, # amount in cents, again
        currency="usd",
        source=token["id"],
        description="To " + prsn 
        )
        data = {
            'amount' = amount
            'token' = token
        }
        requests.post('/pay', data=data)
    except stripe.error.CardError as e:
        print e
        # The card has been declined
        pass

@app.route('/pay', methods=['POST'])
@crossdomain(origin='*')
def pay():
    stripe.api_key = app.config['API_KEY']
    
    amt = request.form['amount']
    token = request.form['token']
    
    stripe.Charge.create(
        amount=amt,
        currency='usd',
        source=token,
        destination={CONNECTED_STRIPE_ACCOUNT_ID}
    )
    

if __name__ == '__main__':
    app.run(debug=True)