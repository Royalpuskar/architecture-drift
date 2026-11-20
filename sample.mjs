export const sample = {
  "layers": {
    "view": "ui",
    "service": "domain",
    "db": "data"
  },
  "allowed": [
    {
      "from": "ui",
      "to": "domain"
    },
    {
      "from": "domain",
      "to": "data"
    }
  ],
  "imports": [
    {
      "from": "view",
      "to": "service"
    },
    {
      "from": "view",
      "to": "db"
    }
  ]
};
