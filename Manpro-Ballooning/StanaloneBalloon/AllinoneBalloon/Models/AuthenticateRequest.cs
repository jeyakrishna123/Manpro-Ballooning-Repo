using System.ComponentModel.DataAnnotations;

namespace AllinoneBalloon.Models
{
    public class AuthenticateRequest
    {
  
        [Required(ErrorMessage = "UserName Field is required")]
        public string UserName { get; set; }

        [Required(ErrorMessage = "Password Field is required")]
        public string Password { get; set; }
    }
    public class CreateRequest
    {

        [Required(ErrorMessage = "Name Field is required")]
        public string UserName { get; set; }

        [Required(ErrorMessage = "UserName Field is required")]
        public string UserEmail { get; set; }

        [Required(ErrorMessage = "Role Field is required")]
        public string UserRole { get; set; }
        

        [Required(ErrorMessage = "Password Field is required")]
        public string Password { get; set; }
    }

    public class UpdateRequest
    {

        [Required(ErrorMessage = "Name Field is required")]
        public string UserName { get; set; }

        [Required(ErrorMessage = "UserName Field is required")]
        public string UserEmail { get; set; }

        [Required(ErrorMessage = "Role Field is required")]
        public string UserRole { get; set; }
        public long UserId { get; set; }
        public string status { get; set; }
        public string Password { get; set; }
    }
}
