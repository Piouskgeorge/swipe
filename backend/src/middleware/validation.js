import Joi from 'joi';

export const validateRegistration = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('interviewer', 'interviewee').required(),
    profile: Joi.object({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      phone: Joi.string().optional(),
      company: Joi.string().optional(),
      position: Joi.string().optional(),
      experience: Joi.number().min(0).optional(),
      skills: Joi.array().items(Joi.string()).optional()
    }).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: 'Validation error',
      details: error.details[0].message
    });
  }
  next();
};

export const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: 'Validation error',
      details: error.details[0].message
    });
  }
  next();
};

export const validateInterview = (req, res, next) => {
  const schema = Joi.object({
    intervieweeId: Joi.string().required(),
    position: Joi.string().required(),
    scheduledAt: Joi.date().iso().required(),
    duration: Joi.number().min(15).max(180).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: 'Validation error',
      details: error.details[0].message
    });
  }
  next();
};