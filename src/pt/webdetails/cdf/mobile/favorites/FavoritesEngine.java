package pt.webdetails.cdf.mobile.favorites;

import java.io.InputStream;
import java.lang.reflect.Method;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.hibernate.Query;
import org.hibernate.Session;
import org.json.JSONException;
import org.json.JSONObject;
import org.pentaho.platform.api.engine.IParameterProvider;
import org.pentaho.platform.api.engine.IPentahoSession;
import org.pentaho.platform.api.engine.IPluginResourceLoader;
import org.pentaho.platform.engine.core.system.PentahoSystem;

/**
 *
 * @author pedro
 */
public class FavoritesEngine
{

  private static final Log logger = LogFactory.getLog(FavoritesEngine.class);
  private static FavoritesEngine _instance;
  private static final SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd HH:mm");
  private static final String favoritesQuery = "pt.webdetails.cdw.favorites.FavoritesEntry.getFavoritesForUser";


  public static synchronized FavoritesEngine getInstance()
  {
    if (_instance == null)
    {
      _instance = new FavoritesEngine();
    }
    return _instance;
  }


  public FavoritesEngine()
  {
    try
    {
      logger.info("Creating CommentsEngine instance");
      initialize();
    }
    catch (PluginHibernateException ex)
    {
      logger.fatal("Could not create CommentsEngine: " + ex.getCause().getMessage()); //$NON-NLS-1$
      return;
    }

  }


  public String process(IParameterProvider requestParams, IPentahoSession userSession)
  {

    String actionParam = requestParams.getStringParameter("action", "");

    Class[] params =
    {
      IParameterProvider.class, IPentahoSession.class
    };
    try
    {

      Method mthd = this.getClass().getMethod(actionParam, params);

      return (String) mthd.invoke(this, requestParams, userSession);


    }
    catch (NoSuchMethodException ex)
    {
      logger.error("NoSuchMethodException : " + actionParam + " - " + ex.getCause().getMessage());
    }
    catch (Exception ex)
    {
      logger.error("Invalid Method Exception: " + actionParam);
    }
    return "";
  }


  public String store(IParameterProvider requestParams, IPentahoSession userSession) throws JSONException, PluginHibernateException
  {


    String user = userSession.getName();
    String storageValue = requestParams.getStringParameter("storageValue", "");

    if (storageValue == null)
    {

      logger.error("Parameter 'storageValue' Can't be null");
    }

    logger.debug("Storing user entry");

    // if we have one, get it. Otherwise, create a new one

    Session session = getSession();
    session.beginTransaction();

    Query query = session.getNamedQuery(favoritesQuery).setString("user", user);
    FavoritesEntry storageEntry = (FavoritesEntry) query.uniqueResult();

    if (storageEntry == null)
    {
      storageEntry = new FavoritesEntry();
      storageEntry.setUser(user);
    }

    storageEntry.setStorageValue(storageValue);
    storageEntry.setLastUpdatedDate(Calendar.getInstance().getTime());


    session.save(storageEntry);
    session.flush();
    session.getTransaction().commit();
    session.close();

    // Return success
    JSONObject json = new JSONObject();
    json.put("result", Boolean.TRUE);

    return json.toString(2);

  }


  public String read(IParameterProvider requestParams, IPentahoSession userSession) throws JSONException
  {

    logger.debug("Reading storage");

    String user = userSession.getName();
    String result = "";
    try
    {
      Session session = getSession();

      Query query = session.getNamedQuery(favoritesQuery).setString("user", user);

      FavoritesEntry storageEntry = (FavoritesEntry) query.uniqueResult();

      // Return it, or an empty value

      result = storageEntry != null ? storageEntry.getStorageValue() : "{}";
      session.close();
    }
    catch (PluginHibernateException ex)
    {
      logger.error("Failed to acquire session");
    }
    finally
    {
      return result;
    }
  }


  public String delete(IParameterProvider requestParams, IPentahoSession userSession) throws JSONException
  {



    String user = userSession.getName();
    String result = "";
    logger.debug("Deleting storage for user " + user);
    try
    {
      Session session = getSession();
      session.beginTransaction();

      Query query = session.getNamedQuery(favoritesQuery).setString("user", user);
      FavoritesEntry storageEntry = (FavoritesEntry) query.uniqueResult();

      if (storageEntry != null)
      {
        session.delete(storageEntry);

      }
      session.flush();
      session.getTransaction().commit();
      session.close();

      // Return success
      JSONObject json = new JSONObject();
      json.put("result", Boolean.TRUE);
      result = json.toString(2);
    }
    catch (PluginHibernateException ex)
    {
      logger.error("Failed to acquire session");
    }
    finally
    {
      return result;
    }
  }


  private synchronized Session getSession() throws PluginHibernateException
  {

    return PluginHibernateUtil.getSession();

  }


  private void initialize() throws PluginHibernateException
  {


    // Get hbm file
    IPluginResourceLoader resLoader = PentahoSystem.get(IPluginResourceLoader.class, null);
    InputStream in = resLoader.getResourceAsStream(FavoritesEngine.class, "hibernate/Favorites.hbm.xml");

    // Close session and rebuild
    PluginHibernateUtil.initialize();
    PluginHibernateUtil.closeSession();
    PluginHibernateUtil.getConfiguration().addInputStream(in);
    PluginHibernateUtil.rebuildSessionFactory();

  }
}
