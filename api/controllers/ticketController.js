const TicketModel = require('../../models/ticketModel');
const asyncWrapper = require('../../middleware/controllerWrapper');
const { createCustomError } = require('../../middleware/customError');
const { find, findOne } = require('../../models/departmentModel');
// const { findOne } = require('../../models/departmentModel');

const verifyUser = (req, res) => {
  if (!req.user)
    return res
      .status(401)
      .json({ success: false, payload: 'You are not authenticated' });
};
const createTicket = asyncWrapper(async (req, res) => {
  console.log(req.user);

  if (!req.user)
    return res
      .status(401)
      .json({ success: false, payload: 'You are not authenticated' });

  /** still working on this
   * const findTicket = await findOne({
   * $and: [{ customer_id: req.body.customer_id }, { title: req.body.title }],
   *  });
   * if (findTicket) {
   * return res
   * .status(400)
   * .json({ success: false, payload: 'Ticket already exist! ' });
   * }
   */

  // redirect to update ticket

  const newTicket = new TicketModel(req.body);
  const savedTicket = await newTicket.save();

  res.status(200).json({ success: true, payload: savedTicket });
});

// gets a single ticket

const getTicket = asyncWrapper(async (req, res, next) => {
  if (!req.user)
    return res
      .status(401)
      .json({ success: false, payload: 'You are not authenticated' });

  //
  if (req.user.id && req.user.role === 3) {
    const ticket = await TicketModel.findOne({ _id: req.params.ticketId });
    // console.log(req.params);
    if (!ticket) return next(createCustomError('no ticket found!', 404));
    res.status(200).json({ success: true, payload: ticket });
  } else {
    res.status(401).json({
      success: false,
      payload: 'you are not authorized to perform this operation ',
    });
  }

  // res.status(200).json('get ticket new route');

  // resetPassword;
});

const updateTicket = asyncWrapper(async (req, res, next) => {
  // this controller updates the ticket base on the user type
  if (!req.user)
    return res
      .status(401)
      .json({ success: false, payload: 'You are not authenticated' });
  const ticketId = req.params.ticketId;

  const {
    dept_id,
    priority,
    ticket_status,
    urgency,
    assignee_id,
    ticket_type,
    title,
    customer_id,
    description,
    attachment,
  } = req.body;

  let query = { _id: ticketId };
  const findTicket = await TicketModel.findOne({ _id: ticketId });
  console.log(findTicket.customer_id);

  if (!findTicket)
    return res
      .status(404)
      .json({ success: false, payload: `invalid ticket is ${ticketId}` });
  // checks if user is an admin
  if (ticketId && req.user.role === 3) {
    const adminUpdatedTicket = await TicketModel.updateOne(query, {
      ticket_type,
      title,
      customer_id,
      description,
      dept_id,
      priority,
      ticket_status,
      urgency,
      assignee_id,
      attachment,
    });
    res.status(200).json({ success: true, payload: adminUpdatedTicket });
  } else if (findTicket.customer_id === req.user.id && req.user.role === 0) {
    const userUpdatedTicket = await TicketModel.updateOne(query, {
      ticket_type,
      title,
      description,
      attachment,
    });
    res.status(200).json({
      success: true,
      payload: userUpdatedTicket,
    });
    res.status(200).json(userUpdatedTicket);
  } else {
    res.status(400).json({
      success: false,
      payload: 'you can not update this ticket ',
    });
  }
});

const listTicket = asyncWrapper(async (req, res) => {
  const checkTickets = (tickets) => {
    if (!tickets)
      return res
        .status(404)
        .json({ success: false, payload: 'no ticket found!' });
    res.status(200).json({
      success: true,
      result: tickets,
      hits: tickets.length,
    });
  };

  // checks is user is authenticated
  verifyUser(req, res);

  const { id, role } = req.user;

  if (id && role === 3) {
    const tickets = await TicketModel.find();

    checkTickets(tickets);
  }
  if (id && role === 0) {
    const tickets = await TicketModel.find({ customer_id: id });
    checkTickets(tickets);
  }
});

// deletes ticket
const deleteTicket = asyncWrapper(async (req, res, next) => {
  const deleteMessage = (deleteTicket) => {
    if (deleteTicket.deletedCount) {
      res.status(200).json({
        success: true,
        payload: 'ticket was deleted successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        payload: 'cannot delete ticket ',
      });
    }
  };
  // checks is user is authenticated
  verifyUser(req, res);
  const ticketId = req.params.ticketId;
  const { id, role } = req.user;
  // console.log();
  if (ticketId && role === 3) {
    const deleteTicket = await TicketModel.deleteOne({
      _id: req.params.ticketId,
    });
    return deleteMessage(deleteTicket);
  }
  // req.body.customer_id is gotten from the application state

  if (role === 0 && id === req.body.customer_id) {
    const deleteTicket = await TicketModel.deleteOne({
      customer_id: req.body.customer_id,
    });
    // console.log(deleteTicket);

    return deleteMessage(deleteTicket);
  }

  next(
    createCustomError('you sre not authorized to perform this operation', 400)
  );
});

module.exports = {
  getTicket,
  createTicket,
  listTicket,
  updateTicket,
  deleteTicket,
};
