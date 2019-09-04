import { connect } from '../db/connection';
import { Conformities, Customers, Deals, Tasks, Tickets } from '../db/models';

/**
 * Rename coc field to contentType
 *
 */
module.exports.up = async () => {
  await connect;
  console.log('start migration on convert conformity');
  try {
    console.log('start migration on customerCompany conformity');
    const customerCompany = await Customers.find({ companyIds: { $exists: true } });
    customerCompany.map(customer =>
      (customer.companyIds || []).map(companyId =>
        Conformities.addConformity({
          mainType: 'customer',
          mainTypeId: customer._id,
          relType: 'company',
          relTypeId: companyId,
        }),
      ),
    );
    console.log('end migration on customerCompany conformity');

    console.log('start migration on dealCustomer conformity');
    const dealCustomer = await Deals.find({ customerIds: { $exists: true } });
    dealCustomer.map(deal =>
      (deal.customerIds || []).map(customerId =>
        Conformities.addConformity({
          mainType: 'deal',
          mainTypeId: deal._id,
          relType: 'customer',
          relTypeId: customerId,
        }),
      ),
    );
    console.log('end migration on dealCustomer conformity');

    console.log('start migration on dealCompany conformity');
    const dealCompany = await Deals.find({ companyIds: { $exists: true } });
    dealCompany.map(deal =>
      (deal.companyIds || []).map(companyId =>
        Conformities.addConformity({
          mainType: 'deal',
          mainTypeId: deal._id,
          relType: 'company',
          relTypeId: companyId,
        }),
      ),
    );
    console.log('end migration on dealCompany conformity');

    console.log('start migration on ticketCustomer conformity');
    const ticketCustomer = await Tickets.find({ customerIds: { $exists: true } });
    ticketCustomer.map(ticket =>
      (ticket.customerIds || []).map(customerId =>
        Conformities.addConformity({
          mainType: 'ticket',
          mainTypeId: ticket._id,
          relType: 'customer',
          relTypeId: customerId,
        }),
      ),
    );
    console.log('end migration on ticketCustomer conformity');

    console.log('start migration on ticketCompany conformity');
    const ticketCompany = await Tickets.find({ companyIds: { $exists: true } });
    ticketCompany.map(ticket =>
      (ticket.companyIds || []).map(companyId =>
        Conformities.addConformity({
          mainType: 'ticket',
          mainTypeId: ticket._id,
          relType: 'company',
          relTypeId: companyId,
        }),
      ),
    );
    console.log('end migration on ticketCompany conformity');

    console.log('start migration on taskCustomer conformity');
    const taskCustomer = await Tasks.find({ customerIds: { $exists: true } });
    taskCustomer.map(task =>
      (task.customerIds || []).map(customerId =>
        Conformities.addConformity({
          mainType: 'task',
          mainTypeId: task._id,
          relType: 'customer',
          relTypeId: customerId,
        }),
      ),
    );
    console.log('end migration on taskCustomer conformity');

    console.log('start migration on taskCompany conformity');
    const taskCompany = await Tasks.find({ companyIds: { $exists: true } });
    taskCompany.map(task =>
      (task.companyIds || []).map(companyId =>
        Conformities.addConformity({
          mainType: 'task',
          mainTypeId: task._id,
          relType: 'company',
          relTypeId: companyId,
        }),
      ),
    );
    console.log('end migration on taskCompany conformity');
  } catch (e) {
    console.log('conformity migration ', e.message);
  }

  return Promise.resolve('ok');
};
