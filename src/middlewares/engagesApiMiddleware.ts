import { Customers } from '../db/models';

/*
 * Handle requests from engages api
 */
const engagesApiMiddleware = async (req, res) => {
  const { action, payload } = req.body;
  const doc = JSON.parse(payload);

  const id = doc._id;

  delete doc._id;

  if (action === 'update-customer') {
    const customer = await Customers.updateCustomer(id, doc);

    return res.json({ _id: customer._id });
  }
};

export default engagesApiMiddleware;
