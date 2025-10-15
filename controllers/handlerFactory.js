const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

/**
 * Gets all or filtered documents from the given model
 */
exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // Builds query to find all or filtered documents
    const features = new APIFeatures(Model.find(req.idFilter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // Executes query to get the documents
    const docs = await features.query;
    // const docs = await features.query.explain();

    // Sends response
    res.status(200).json({
      status: 'sucesss',
      results: docs.length,
      data: {
        data: docs,
      },
    });
  });

/**
 * Gets one document from the given model.
 */
exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    // Builds document query to find document with the paramter id
    let query = Model.findById(req.params.id);

    // Populates any references as specified
    if (popOptions) query = query.populate(popOptions);

    // Executes query  to get the document
    const doc = await query;

    // Throws an error if document doesn't exist
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    // Sends response
    res.status(200).json({
      status: 'sucesss',
      data: {
        data: doc,
      },
    });
  });

/**
 * Gets one document in the given model.
 */
exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // Creates document based on  details in the body
    const newDoc = await Model.create(req.body);

    // Sends response
    res.status(201).json({
      status: 'success',
      data: {
        data: newDoc,
      },
    });
  });

/**
 * Updates one document in the given model.
 */
exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // Finds document with the paramter id and updates it based on details in the body
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Throws an error if document doesn't exist
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    // Sends response
    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

/**
 * Updates one document from the given model.
 */
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // Finds document with the paramter id and deleted it
    const doc = await Model.findByIdAndDelete(req.params.id);

    // Throws an error if document doesn't exist
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    // Sends response
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
