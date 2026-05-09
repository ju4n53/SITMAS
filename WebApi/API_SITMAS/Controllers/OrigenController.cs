using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace API_SITMAS.Controllers
{
    public class OrigenController : ApiController
    {
        // GET: api/Origen
        public IEnumerable<string> Get()
        {
            return new string[] { "value1", "value2" };
        }

        // GET: api/Origen/5
        public string Get(int id)
        {
            return "value";
        }

        // POST: api/Origen
        public void Post([FromBody]string value)
        {
        }

        // PUT: api/Origen/5
        public void Put(int id, [FromBody]string value)
        {
        }

        // DELETE: api/Origen/5
        public void Delete(int id)
        {
        }
    }
}
